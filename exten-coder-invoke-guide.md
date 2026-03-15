# Exten-Coder Agent Invocation Guide

[中文文档](exten-coder-invoke-guide.zh.md) | [English](exten-coder-invoke-guide.md)

## Agent Identity
- **Name**: exten-coder
- **Role**: Chrome Extension Development Specialist
- **Expertise**: Chrome extension development, Manifest V3, browser plugin architecture design

---

## When to Invoke This Agent

### Core Trigger Scenarios

#### 1. Chrome Extension Development Related
```
Trigger Keywords:
- "Chrome extension" / "Chrome扩展"
- "browser extension" / "浏览器插件"
- "Chrome插件" / "Chrome扩展程序"
- "manifest.json" / "Manifest V3"
- "content script" / "background script"
- "popup" / "options page"
```

**Typical Task Examples**:
- "Help me develop a Chrome extension..."
- "How to create a browser plugin to implement..."
- "How to configure Manifest V3..."
- "Chrome extension permission issues..."
- "content script injection failed..."

#### 2. Chrome Extension API Usage
```
Trigger Keywords:
- "chrome.tabs" / "chrome.storage"
- "chrome.runtime" / "chrome.webRequest"
- "chrome.alarms" / "chrome.bookmarks"
- "declarativeNetRequest"
- "Native Messaging"
```

**Typical Task Examples**:
- "How to use chrome.tabs API..."
- "chrome.storage data storage..."
- "Implement cross-domain requests..."
- "Native Messaging configuration..."

#### 3. Extension Architecture & Design
```
Trigger Keywords:
- "Extension architecture design"
- "Permission minimization"
- "service worker"
- "Message passing mechanism"
- "Extension performance optimization"
```

**Typical Task Examples**:
- "Design an extension architecture..."
- "How to optimize extension performance..."
- "Extension security best practices..."
- "service worker lifecycle..."

#### 4. Extension Debugging & Troubleshooting
```
Trigger Keywords:
- "Extension error" / "extension error"
- "Permission denied" / "permission denied"
- "content script not working"
- "background script crash"
- "Chrome Web Store review"
```

**Typical Task Examples**:
- "Extension error on Chrome..."
- "Permission configuration issues..."
- "Extension review rejected..."
- "Debugging service worker..."

#### 5. Extension Publishing & Deployment
```
Trigger Keywords:
- "Chrome Web Store"
- "Extension publish" / "extension publish"
- "Extension build" / "extension build"
- "Version update" / "extension update"
```

**Typical Task Examples**:
- "How to publish Chrome extension..."
- "Extension packaging configuration..."
- "Chrome Web Store review requirements..."
- "Extension auto-update mechanism..."

---

## Precise Identification Standards

### Strongly Related Scenarios (Direct Invocation)

**Scenario Characteristics**:
- Explicitly mention "Chrome extension", "browser plugin" and other keywords
- Involve manifest.json configuration
- Use Chrome Extension API
- Discuss extension permissions, security, performance
- Extension development, debugging, publishing process

**Decision Logic**:
```
IF task involves any of the following:
  - Chrome Extension development
  - Manifest V3 configuration
  - Chrome Extension API usage
  - Browser plugin architecture design
  - Extension debugging & troubleshooting
  - Chrome Web Store publishing
THEN → Invoke exten-coder
```

### Moderately Related Scenarios (Priority Consideration)

**Scenario Characteristics**:
- Browser automation related to extensions
- Web page content operations combined with extensions
- Cross-browser compatibility development
- Browser extension integration with other tools

**Decision Logic**:
```
IF task involves any of the following:
  - Browser automation requirements
  - Web page content monitoring/modification
  - Browser extension integration
  - User script development
THEN → Priority consideration for exten-coder, but evaluate if other agents are more suitable
```

### Weakly Related Scenarios (May Need)

**Scenario Characteristics**:
- Frontend development but may involve browser extensions
- Browser compatibility in web development
- Users need browser enhancement features

**Decision Logic**:
```
IF task involves any of the following:
  - Frontend development but user mentions browser extension possibility
  - Web functionality needs browser enhancement
  - User asks about browser extension feasibility
THEN → Suggest invoking exten-coder for professional advice
```

---

## When NOT to Invoke This Agent

### Explicit Exclusion Scenarios

1. **Pure Frontend Development** (no extension requirements)
   - React/Vue/Angular application development
   - Ordinary web page development
   - Node.js backend development
   - → Invoke general frontend/backend agents

2. **Other Browser Extensions**
   - Firefox Add-on development
   - Safari Extension development
   - Edge Extension development (non-Chromium)
   - → Invoke general browser extension agents or relevant experts

3. **Non-Browser Related**
   - Desktop application development
   - Mobile application development
   - Pure backend service development
   - → Invoke relevant domain agents

4. **Chrome DevTools Usage** (not extension development)
   - DevTools debugging techniques
   - Performance analysis tool usage
   - → Invoke debugging tool agents

---

## Collaboration with Other Agents

### Collaboration Scenarios

#### With Frontend Development Agent
```
Scenario: Developing Chrome extension popup/options pages
Process:
1. exten-coder: Design extension architecture, manifest configuration, permission design
2. Frontend Agent: Implement popup/options page UI and interactions
3. exten-coder: Integrate into extension, handle message passing
```

#### With Backend Development Agent
```
Scenario: Extension needs to interact with backend API
Process:
1. exten-coder: Design extension data acquisition plan, permission configuration
2. Backend Agent: Develop API interfaces
3. exten-coder: Implement extension-side API calls and data processing
```

#### With Testing Agent
```
Scenario: Extension automated testing
Process:
1. exten-coder: Provide extension testing points, API mock solutions
2. Testing Agent: Write test cases, test framework configuration
3. exten-coder: Verify test coverage, fix discovered issues
```

---

## Priority Judgment Matrix

| Task Type | exten-coder Priority | Recommended Agent |
|-----------|---------------------|-------------------|
| Chrome Extension Development | Highest | exten-coder |
| Manifest V3 Configuration | Highest | exten-coder |
| Chrome Extension API | Highest | exten-coder |
| Extension Debugging & Publishing | Highest | exten-coder |
| Browser Automation | Medium | exten-coder / Automation Agent |
| User Script Development | Medium | exten-coder / Script Agent |
| Pure Frontend Development | Low | Frontend Development Agent |
| Other Browser Extensions | Low | General Extension Agent |

---

## Quick Identification Decision Tree

```
User Question
    │
    ├─ Does it explicitly mention "Chrome extension/plugin"?
    │   ├─ Yes → Invoke exten-coder
    │   └─ No ↓
    │
    ├─ Does it involve manifest.json or Manifest V3?
    │   ├─ Yes → Invoke exten-coder
    │   └─ No ↓
    │
    ├─ Does it use Chrome Extension API?
    │   ├─ Yes → Invoke exten-coder
    │   └─ No ↓
    │
    ├─ Does it involve browser extension development process?
    │   ├─ Yes → Invoke exten-coder
    │   └─ No ↓
    │
    ├─ Does it involve browser automation or content scripts?
    │   ├─ Yes → Consider exten-coder
    │   └─ No ↓
    │
    └─ Other scenarios → Do not invoke exten-coder
```

---

## Actual Invocation Examples

### Example 1: Explicit Trigger
```
User: "I want to develop a Chrome extension that auto-fills web forms"
System Judgment:
  - Keywords: "Chrome extension"
  - Task: Extension development
  → Invoke exten-coder
```

### Example 2: Technical Term Trigger
```
User: "How to configure manifest.json permissions field?"
System Judgment:
  - Keywords: "manifest.json", "permissions"
  - Task: Manifest configuration
  → Invoke exten-coder
```

### Example 3: Troubleshooting Trigger
```
User: "My extension errors on Chrome 120: Cannot read property 'tabs' of undefined"
System Judgment:
  - Keywords: "extension", "Chrome", "tabs"
  - Task: Extension debugging
  → Invoke exten-coder
```

### Example 4: Should Not Trigger
```
User: "Help me develop a React application with user login functionality"
System Judgment:
  - No extension-related keywords
  - Pure frontend development task
  → Do not invoke exten-coder, invoke frontend development agent
```

### Example 5: Needs Further Judgment
```
User: "I want to automatically scrape web data in browser"
System Judgment:
  - May be extension development
  - May also be crawler or automation script
  → First ask user if they need to develop Chrome extension
    If yes → Invoke exten-coder
    If no → Invoke crawler/automation agent
```

---

## Summary

**Core Judgment Standards for Invoking exten-coder**:

1. **Explicitness**: Task explicitly involves Chrome extension development
2. **Professionalism**: Requires Chrome Extension API professional knowledge
3. **Completeness**: Covers extension development full process (design→development→testing→publishing)
4. **Uniqueness**: Value provided by exten-coder is irreplaceable by other agents

**Remember**: When uncertain, prioritize user intent. If user may need Chrome extension solution, suggest invoking exten-coder for professional advice.
