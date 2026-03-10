#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{State, Manager, Runtime, Emitter};
use warp::Filter;
use image::io::Reader as ImageReader;
use image::GenericImageView;
use base64::engine::general_purpose;
use base64::Engine as _;
use walkdir::WalkDir;
use std::io::Cursor;
use chrono::Local;

#[derive(Clone)]
struct AppState {
    images: Arc<Mutex<HashMap<String, ImageInfo>>>,
    auto_run: Arc<Mutex<bool>>,
    auto_close: Arc<Mutex<bool>>,
    folder_path: Arc<Mutex<Option<String>>>,
    app_handle: Arc<Mutex<Option<tauri::AppHandle<tauri::Wry>>>>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct ImageInfo {
    path: String,
    sent: bool,
}

fn now() -> String {
    Local::now().format("%Y-%m-%d %H:%M:%S%.3f").to_string()
}

#[tauri::command]
async fn open_folder<R: Runtime>(_app: tauri::AppHandle<R>, state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    println!("[{}] [命令] 收到打开文件夹命令", now());
    
    // 使用原生文件对话框
    let dialog_result = rfd::AsyncFileDialog::new()
        .pick_folder()
        .await;
    
    match dialog_result {
        Some(path) => {
            let path_str = path.path().to_string_lossy().to_string();
            let mut images = HashMap::new();
            
            for entry in WalkDir::new(&path_str).into_iter().filter_map(|e| e.ok()) {
                let entry_path = entry.path();
                if entry_path.is_file() {
                    let ext = entry_path.extension().and_then(|s| s.to_str()).unwrap_or("");
                    if ["jpg", "jpeg", "png", "gif", "bmp"].contains(&ext.to_lowercase().as_str()) {
                        let image_path = entry_path.to_str().unwrap().to_string();
                        images.insert(image_path.clone(), ImageInfo {
                            path: image_path,
                            sent: false,
                        });
                    }
                }
            }
            
            let count = images.len();
            
            // 更新状态
            *state.images.lock().unwrap() = images;
            *state.folder_path.lock().unwrap() = Some(path_str.clone());
            
            Ok(serde_json::json!({
                "path": path_str,
                "count": count
            }))
        }
        None => Err("用户取消了文件夹选择".to_string()),
    }
}

#[tauri::command]
fn set_auto_run(enabled: bool, state: State<AppState>) {
    println!("[{}] [命令] 设置自动运行: {}", now(), enabled);
    *state.auto_run.lock().unwrap() = enabled;
}

#[tauri::command]
fn set_auto_close(enabled: bool, state: State<AppState>) {
    println!("[{}] [命令] 设置自动关闭: {}", now(), enabled);
    *state.auto_close.lock().unwrap() = enabled;
}

#[tauri::command]
fn test_api() -> Result<String, String> {
    println!("[{}] [命令] 收到API测试命令", now());
    Ok("API测试成功".to_string())
}

async fn start_server(state: AppState) {
    println!("[{}] [服务器] 启动HTTP服务器，监听端口: 30008", now());
    let images = state.images.clone();
    let auto_run = state.auto_run.clone();
    let auto_close = state.auto_close.clone();
    let app_handle = state.app_handle.clone();
    
    // API 1: 连接测试
    let api_connect = warp::path("api")
        .and(warp::path("connect"))
        .and(warp::get())
        .map(|| {
            println!("[{}] [API] 收到连接请求", now());
            warp::reply::json(&serde_json::json!({
                "success": true,
                "message": "连接成功"
            }))
        });
    
    // API 2: 查询是否自动运行
    let api_auto_run = {
        let auto_run = auto_run.clone();
        warp::path("api")
            .and(warp::path("auto-run"))
            .and(warp::get())
            .map(move || {
                println!("[{}] [API] 收到自动运行状态查询请求", now());
                let auto_run = *auto_run.lock().unwrap();
                warp::reply::json(&serde_json::json!({
                    "success": true,
                    "message": "是否开启自动运行",
                    "enabled": auto_run
                }))
            })
    };
    
    // API 3: 请求图片base64编码
    let api_get_image = {
        let images = images.clone();
        let app_handle = app_handle.clone();
        warp::path("api")
            .and(warp::path("get-image"))
            .and(warp::get())
            .map(move || {
                println!("[{}] [API] 收到获取图片请求", now());
                let mut images = images.lock().unwrap();
                let total_count = images.len();
                
                // 寻找未发送的图片，先提取path
                let path_to_send = {
                    images.iter_mut()
                        .find(|(_, info)| !info.sent)
                        .map(|(p, i)| {
                            i.sent = true;
                            p.clone()
                        })
                };
                
                if let Some(path) = path_to_send {
                    let sent_count = images.values().filter(|info| info.sent).count();
                    
                    // 读取图片并转换为base64
                    match ImageReader::open(&path) {
                        Ok(reader) => {
                            match reader.decode() {
                                Ok(img) => {
                                    // 缩小图片到短边720
                                    let (width, height) = img.dimensions();
                                    let target_short = 720u32;
                                    let (new_width, new_height) = if width < height {
                                        (target_short, (height as f32 * target_short as f32 / width as f32) as u32)
                                    } else {
                                        ((width as f32 * target_short as f32 / height as f32) as u32, target_short)
                                    };
                                    let resized = img.resize(new_width, new_height, image::imageops::FilterType::Triangle);
                                    
                                    let mut buffer = Vec::new();
                                    let mut cursor = Cursor::new(&mut buffer);
                                    if resized.write_to(&mut cursor, image::ImageOutputFormat::Png).is_ok() {
                                        println!("[{}] [API] 图片已缩小并转换为base64: {}x{}", now(), new_width, new_height);
                                        let base64 = general_purpose::STANDARD.encode(&buffer);
                                        
                                        // 发送给前端更新计数
                                        let handle = app_handle.lock().unwrap();
                                        if let Some(h) = handle.as_ref() {
                                            let _ = h.emit("sent-count-update", serde_json::json!({
                                                "sent": sent_count,
                                                "total": total_count
                                            }));
                                        }
                                        
                                        return warp::reply::json(&serde_json::json!({
                                            "success": true,
                                            "base64": base64,
                                            "path": path
                                        }));
                                    }
                                }
                                Err(_) => {}
                            }
                        }
                        Err(_) => {}
                    }
                }
                
                warp::reply::json(&serde_json::json!({
                    "success": false,
                    "message": "没有可用图片"
                }))
            })
    };
    
    // API 5: 获取计数
    let api_get_counts = {
        let images = images.clone();
        warp::path("api")
            .and(warp::path("counts"))
            .and(warp::get())
            .map(move || {
                println!("[{}] [API] 收到获取计数请求", now());
                let images = images.lock().unwrap();
                let total = images.len();
                let sent = images.values().filter(|info| info.sent).count();
                
                warp::reply::json(&serde_json::json!({
                    "total": total,
                    "sent": sent
                }))
            })
    };
    
    let api_get_folder_path = {
        let state = state.clone();
        warp::path("api")
            .and(warp::path("folder-path"))
            .and(warp::get())
            .map(move || {
                println!("[{}] [API] 收到获取文件夹路径请求", now());
                let folder = state.folder_path.lock().unwrap().clone();
                warp::reply::json(&serde_json::json!({
                    "success": true,
                    "path": folder
                }))
            })
    };
    
    let routes = api_connect
        .or(api_auto_run)
        .or(api_get_image)
        .or(api_get_counts)
        .or(api_get_folder_path)
        .with(warp::cors().allow_any_origin().allow_methods(vec!["GET", "POST", "OPTIONS"]));
    
    warp::serve(routes).run(([127, 0, 0, 1], 30008)).await;
}

fn main() {
    println!("[{}] [应用] 启动Autorunway应用", now());
    
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            images: Arc::new(Mutex::new(HashMap::new())),
            auto_run: Arc::new(Mutex::new(false)),
            auto_close: Arc::new(Mutex::new(false)),
            folder_path: Arc::new(Mutex::new(None)),
            app_handle: Arc::new(Mutex::new(None)),
        })
        .invoke_handler(tauri::generate_handler![open_folder, set_auto_run, set_auto_close, test_api])
        .setup(|app| {
            println!("[{}] [应用] 初始化完成，启动HTTP服务器", now());
            let state = app.state::<AppState>().inner().clone();
            *state.app_handle.lock().unwrap() = Some(app.handle().clone());
            tauri::async_runtime::spawn(start_server(state));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}