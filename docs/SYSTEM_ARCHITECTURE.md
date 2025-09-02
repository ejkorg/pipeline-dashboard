# Pipeline Dashboard - System Architecture & Flow Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Component Architecture](#component-architecture)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Build & Deployment](#build--deployment)
8. [Configuration Management](#configuration-management)
9. [Error Handling & Resilience](#error-handling--resilience)
10. [Performance & Caching](#performance--caching)
11. [Testing Strategy](#testing-strategy)
12. [Security Considerations](#security-considerations)
13. [Monitoring & Debugging](#monitoring--debugging)

## Overview

The Pipeline Dashboard is a modern Vue 3 + TypeScript Single Page Application (SPA) designed to monitor and visualize pipeline execution data. It provides real-time insights into pipeline performance, status tracking, and data processing metrics through interactive charts and tables.

### Key Features
- **Real-time Pipeline Monitoring**: Live updates of pipeline execution status
- **Interactive Data Visualization**: Charts and tables for performance metrics
- **Offline Mode**: Local data browsing when API is unavailable
- **Import/Export**: JSON and CSV data exchange capabilities
- **Responsive Design**: Mobile-friendly interface with dark mode support
- **Configurable API Integration**: Flexible backend connectivity

### Technology Stack
- **Frontend Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **State Management**: Pinia
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Chart.js + vue-chartjs
- **HTTP Client**: Native Fetch API with timeout support
- **Validation**: Zod schemas
- **Testing**: Vitest + Testing Library

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Environment                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Vue 3 App     │  │   Pinia Stores  │  │  Services   │ │
│  │                 │  │                 │  │             │ │
│  │ • Components    │  │ • Pipelines     │  │ • API       │ │
│  │ • Composables   │  │ • Preferences   │  │ • Cache     │ │
│  │ • Routing       │  │ • Toasts        │  │ • Realtime  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   HTTP Layer    │  │   WebSocket     │  │  Local      │ │
│  │                 │  │   (Future)      │  │  Storage    │ │
│  │ • Fetch API     │  │ • Socket.io     │  │ • IndexedDB │ │
│  │ • Timeout       │  │ • Events        │  │ • Cache     │ │
│  │ • CORS          │  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ FastAPI/Uvicorn │  │   Database      │  │  File       │ │
│  │                 │  │                 │  │  System     │ │
│  │ • REST API      │  │ • Pipeline      │  │ • Logs      │ │
│  │ • WebSocket     │  │ • Metadata      │  │ • Output    │ │
│  │ • CORS          │  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Core Architecture Patterns

1. **Component-Based Architecture**: Vue 3 Composition API with reusable components
2. **Store-Based State Management**: Pinia for centralized state management
3. **Service Layer Pattern**: Dedicated services for API, caching, and utilities
4. **Composable Pattern**: Vue composables for reusable reactive logic
5. **Observer Pattern**: Event-driven updates for real-time features

## Data Flow Architecture

### Data Flow Diagram

```
User Interaction
       │
       ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Components  │───▶│ Composables │───▶│   Stores   │
│             │    │             │    │            │
│ • UI Events │    │ • Filtering │    │ • State    │
│ • User Input│    │ • Sorting   │    │ • Actions  │
└─────────────┘    └─────────────┘    └─────────────┘
       ▲                     ▲              │
       │                     │              ▼
       │              ┌─────────────┐    ┌─────────────┐
       │              │  Services   │    │   Cache    │
       │              │             │    │            │
       └──────────────│ • API Calls │◀───│ • In-Memory│
                      │ • Validation│    │ • Local    │
                      └─────────────┘    └─────────────┘
                             │
                             ▼
                    ┌─────────────┐
                    │   Backend   │
                    │   API       │
                    │             │
                    │ • REST      │
                    │ • WebSocket │
                    └─────────────┘
```

### Data Pipeline Stages

1. **User Interaction**: UI events trigger data requests
2. **Component Layer**: Components emit events and update reactive state
3. **Composable Layer**: Business logic processing (filtering, sorting, pagination)
4. **Store Layer**: Centralized state management and actions
5. **Service Layer**: API communication and data transformation
6. **Cache Layer**: Performance optimization and offline support
7. **Backend Integration**: External API and real-time updates

## Component Architecture

### Component Hierarchy

```
App.vue (Root)
├── Header
│   ├── Data Source Badge
│   └── Dark Mode Toggle
├── Dashboard.vue (Main Container)
│   ├── API Controls
│   │   ├── Limit/Offset Inputs
│   │   ├── All Data Toggle
│   │   └── Refresh Button
│   ├── Offline Banner
│   ├── Error Display
│   ├── Pipeline Summary Dashboard
│   │   ├── Summary Cards
│   │   ├── Pipeline Table
│   │   │   ├── Table Headers
│   │   │   ├── Table Rows
│   │   │   └── Pagination
│   │   ├── Charts (Lazy-loaded)
│   │   │   ├── Pipeline Chart
│   │   │   └── Row Count Chart
│   │   └── Details Modal
│   ├── Import/Export Controls
│   └── Toast Notifications
└── Error Boundary
```

### Component Types

1. **Page Components**: Main application views (Dashboard)
2. **Layout Components**: Structural elements (Header, ErrorBoundary)
3. **UI Components**: Reusable interface elements (Buttons, Inputs, Tables)
4. **Feature Components**: Domain-specific functionality (Charts, Modals)
5. **Async Components**: Lazy-loaded components for performance

## State Management

### Pinia Store Architecture

```
Pinia Store Structure
├── Pipelines Store
│   ├── State
│   │   ├── pipelines: PipelineRun[]
│   │   ├── loading: boolean
│   │   ├── error: string | null
│   │   ├── lastFetch: number | null
│   │   └── lastFetchSource: 'live' | 'offline' | 'fallback'
│   ├── Getters
│   │   ├── total: computed
│   │   ├── totalDuration: computed
│   │   ├── avgDuration: computed
│   │   └── totalRows: computed
│   └── Actions
│       ├── fetchPipelines()
│       ├── startPolling()
│       ├── stopPolling()
│       ├── enableRealtime()
│       └── disableRealtime()
├── Preferences Store
│   ├── State
│   │   ├── darkMode: boolean
│   │   ├── tablePageSize: number
│   │   ├── sortKey: string
│   │   ├── sortOrder: 'asc' | 'desc'
│   │   ├── search: string
│   │   ├── apiLimit: number
│   │   ├── apiOffset: number
│   │   └── apiAllData: boolean
│   └── Actions
│       ├── toggleDark()
│       ├── setPageSize()
│       ├── setSort()
│       └── setSearch()
└── Toasts Store
    ├── State
    │   ├── toasts: Toast[]
    │   └── nextId: number
    └── Actions
        ├── push()
        ├── remove()
        └── clear()
```

### State Flow Patterns

1. **Reactive State**: Vue's reactivity system for automatic UI updates
2. **Computed Properties**: Derived state for performance optimization
3. **Persistent State**: localStorage integration for user preferences
4. **Event-Driven Updates**: Store actions triggered by user interactions
5. **Async State Management**: Loading states and error handling

## API Integration

### API Service Architecture

```
API Service Layer
├── Configuration
│   ├── Base URL Management
│   ├── Endpoint Building
│   ├── Timeout Settings
│   └── Environment Variables
├── HTTP Client
│   ├── Fetch with Timeout
│   ├── Request/Response Interceptors
│   ├── Error Handling
│   └── Retry Logic
├── Data Transformation
│   ├── Schema Validation (Zod)
│   ├── Data Normalization
│   ├── Type Conversion
│   └── Trend Calculation
├── Caching Strategy
│   ├── In-Memory Cache
│   ├── Cache Key Generation
│   ├── Cache Invalidation
│   └── Offline Fallback
└── Real-time Updates
    ├── WebSocket Connection
    ├── Event Handling
    └── State Synchronization
```

### API Endpoints

```
GET /get_pipeline_info
├── Query Parameters
│   ├── limit: number (optional)
│   ├── offset: number (optional)
│   └── all_data: boolean (optional)
├── Response Formats
│   ├── Array Format: PipelineRun[]
│   ├── Envelope Format: { results: PipelineRun[], total: number, count: number }
│   └── Single Object: PipelineRun
└── Response Fields
    ├── start_utc: string
    ├── end_utc: string
    ├── elapsed_seconds: number
    ├── pipeline_name: string
    ├── rowcount: number
    ├── status: string
    └── ... (additional fields)
```

### Data Processing Pipeline

1. **Request Building**: Construct API URLs with query parameters
2. **HTTP Request**: Make fetch calls with timeout and error handling
3. **Response Validation**: Zod schema validation for type safety
4. **Data Normalization**: Transform raw API data to consistent format
5. **Trend Analysis**: Calculate performance trends between runs
6. **Caching**: Store results for performance optimization
7. **State Update**: Update Pinia stores with processed data

## Build & Deployment

### Build Configuration

```
Vite Build System
├── Entry Points
│   ├── index.html (SPA entry)
│   └── src/main.ts (Vue app bootstrap)
├── Plugin Configuration
│   ├── Vue Plugin (SFC support)
│   ├── Auto Import (Vue APIs)
│   ├── Components (auto-registration)
│   └── Path Aliases (@/ -> src/)
├── Build Optimization
│   ├── Code Splitting (vendor chunks)
│   ├── Tree Shaking
│   ├── Minification
│   └── Source Maps
├── Development Server
│   ├── Hot Module Replacement
│   ├── API Proxy Configuration
│   └── CORS Handling
└── Environment Handling
    ├── .env files
    ├── Mode-specific configs
    └── Build-time variables
```

### Deployment Architecture

```
Production Deployment
├── NGINX Web Server
│   ├── Static Asset Serving
│   ├── SPA Routing (try_files)
│   ├── API Proxy (/pipeline-service)
│   ├── CORS Configuration
│   └── Cache Headers
├── Backend Services
│   ├── FastAPI Application
│   ├── Uvicorn ASGI Server
│   ├── Database Connection
│   └── File System Access
├── Environment Configuration
│   ├── Environment Variables
│   ├── Configuration Files
│   └── Secrets Management
└── Monitoring & Logging
    ├── Application Logs
    ├── Error Tracking
    └── Performance Metrics
```

## Configuration Management

### Environment Variables

```
Environment Configuration
├── API Configuration
│   ├── VITE_API_BASE_URL
│   ├── VITE_API_ENDPOINT_PATH
│   ├── VITE_API_TIMEOUT_MS
│   └── VITE_API_POLL_SECONDS
├── Feature Flags
│   ├── VITE_USE_MOCK_DATA
│   ├── VITE_OFFLINE_MODE
│   ├── VITE_STRICT_NO_FALLBACK
│   └── VITE_DEBUG_SCHEMA
├── Build Configuration
│   ├── VITE_BASE_PATH
│   ├── VITE_DEV_PROXY_TARGET
│   └── VITE_DEBUG
└── Development Settings
    ├── VITE_API_POLL_SECONDS
    └── VITE_DEBUG_SCHEMA
```

### Configuration Sources

1. **Environment Files**: `.env`, `.env.development`, `.env.production`
2. **Runtime Configuration**: Dynamic settings via UI controls
3. **Persistent Storage**: localStorage for user preferences
4. **Build-time Variables**: Vite environment variables
5. **Default Values**: Fallback values in code

## Error Handling & Resilience

### Error Handling Strategy

```
Error Handling Architecture
├── Global Error Boundary
│   ├── Vue Error Handler
│   ├── Unhandled Promise Rejections
│   └── Runtime Errors
├── API Error Handling
│   ├── Network Errors
│   ├── Timeout Errors
│   ├── HTTP Status Errors
│   └── Schema Validation Errors
├── Fallback Mechanisms
│   ├── Offline Mode
│   ├── Mock Data Fallback
│   ├── Cached Data
│   └── Graceful Degradation
├── User Feedback
│   ├── Toast Notifications
│   ├── Error Messages
│   ├── Loading States
│   └── Retry Mechanisms
└── Logging & Monitoring
    ├── Console Logging
    ├── Error Reporting
    └── Performance Monitoring
```

### Resilience Patterns

1. **Graceful Degradation**: Continue functioning with reduced features
2. **Fallback Data**: Use cached or mock data when API fails
3. **Retry Logic**: Automatic retry for transient failures
4. **Offline Support**: Full functionality without network
5. **Progressive Enhancement**: Enhanced features when available

## Performance & Caching

### Caching Strategy

```
Caching Architecture
├── In-Memory Cache
│   ├── API Response Cache
│   ├── Cache Key Generation
│   ├── Cache Expiration
│   └── Cache Invalidation
├── Browser Storage
│   ├── localStorage (preferences)
│   ├── IndexedDB (large datasets)
│   └── Service Worker (future)
├── HTTP Caching
│   ├── Static Asset Caching
│   ├── Cache Headers
│   └── CDN Integration
└── Application Cache
    ├── Component Caching
    ├── Computed Property Caching
    └── Lazy Loading
```

### Performance Optimizations

1. **Code Splitting**: Dynamic imports for large components
2. **Lazy Loading**: Async components for charts and heavy features
3. **Virtual Scrolling**: Efficient rendering of large datasets
4. **Memoization**: Computed properties for expensive calculations
5. **Debouncing**: Input handling optimization
6. **Bundle Optimization**: Tree shaking and minification

## Testing Strategy

### Testing Architecture

```
Testing Pyramid
├── Unit Tests (80%)
│   ├── Component Tests
│   ├── Composable Tests
│   ├── Service Tests
│   └── Utility Tests
├── Integration Tests (15%)
│   ├── API Integration
│   ├── Store Integration
│   └── Component Integration
├── End-to-End Tests (5%)
│   ├── User Journey Tests
│   └── Critical Path Tests
└── Testing Infrastructure
    ├── Test Runners (Vitest)
    ├── Test Utilities (Testing Library)
    ├── Mock Services
    └── Test Data
```

### Test Categories

1. **Component Tests**: Vue component rendering and interaction
2. **Composable Tests**: Reactive logic and state management
3. **Service Tests**: API calls, caching, and data transformation
4. **Integration Tests**: Component-store-service interactions
5. **E2E Tests**: Full user workflows and critical paths

## Security Considerations

### Security Architecture

```
Security Measures
├── Input Validation
│   ├── TypeScript Type Safety
│   ├── Zod Schema Validation
│   ├── Sanitization Functions
│   └── Input Encoding
├── Network Security
│   ├── HTTPS Enforcement
│   ├── CORS Configuration
│   ├── Content Security Policy
│   └── Request Validation
├── Data Protection
│   ├── No Sensitive Data Storage
│   ├── Secure API Communication
│   ├── Input Sanitization
│   └── XSS Prevention
├── Authentication & Authorization
│   ├── No Authentication Required
│   ├── API Key Management (Future)
│   └── Role-Based Access (Future)
└── Audit & Monitoring
    ├── Request Logging
    ├── Error Tracking
    └── Security Monitoring
```

### Security Best Practices

1. **Input Validation**: Comprehensive validation of all inputs
2. **Output Encoding**: Proper encoding of dynamic content
3. **Secure Headers**: Appropriate HTTP security headers
4. **Dependency Management**: Regular security updates
5. **Code Review**: Security-focused code review process

## Monitoring & Debugging

### Monitoring Architecture

```
Monitoring & Observability
├── Application Monitoring
│   ├── Performance Metrics
│   ├── Error Tracking
│   ├── User Analytics
│   └── Health Checks
├── Logging Strategy
│   ├── Structured Logging
│   ├── Log Levels
│   ├── Log Aggregation
│   └── Log Analysis
├── Debugging Tools
│   ├── Browser DevTools
│   ├── Vue DevTools
│   ├── Network Monitoring
│   └── Performance Profiling
└── Alerting & Notification
    ├── Error Alerts
    ├── Performance Alerts
    ├── System Health
    └── User Feedback
```

### Debug Features

1. **Development Logging**: Comprehensive console logging in dev mode
2. **Debug Helpers**: Browser console functions for troubleshooting
3. **Performance Monitoring**: Component render timing and API response times
4. **State Inspection**: Vue DevTools integration for state debugging
5. **Network Debugging**: Request/response inspection and timing

---

## Key Design Decisions

### 1. Vue 3 Composition API
- **Rationale**: Better TypeScript support, improved performance, cleaner code organization
- **Benefits**: Reusable composables, better tree-shaking, improved DX

### 2. Pinia for State Management
- **Rationale**: Official Vue 3 state management solution, TypeScript-first
- **Benefits**: Better DX than Vuex, modular architecture, devtools integration

### 3. Vite Build System
- **Rationale**: Fast development server, optimized production builds
- **Benefits**: Instant HMR, efficient bundling, plugin ecosystem

### 4. Tailwind CSS
- **Rationale**: Utility-first approach, consistent design system
- **Benefits**: Rapid development, small bundle size, responsive design

### 5. Zod Schema Validation
- **Rationale**: Runtime type validation, TypeScript integration
- **Benefits**: Type safety at runtime, better error messages, API validation

### 6. Service Layer Pattern
- **Rationale**: Separation of concerns, testability, reusability
- **Benefits**: Clean architecture, easy mocking, maintainable code

## Future Enhancements

### Planned Features
1. **Advanced Filtering**: Date range filters, multi-column sorting
2. **Real-time WebSocket**: Live updates without polling
3. **Advanced Charts**: More visualization types and interactivity
4. **Export Enhancements**: PDF reports, scheduled exports
5. **User Management**: Authentication and user-specific dashboards
6. **Performance Monitoring**: Detailed performance analytics
7. **Mobile App**: React Native or Capacitor implementation

### Technical Debt & Improvements
1. **Code Splitting**: Further optimize bundle sizes
2. **Testing Coverage**: Increase test coverage to 90%+
3. **Error Boundaries**: More granular error handling
4. **Accessibility**: WCAG compliance improvements
5. **Internationalization**: Multi-language support
6. **Performance**: Virtual scrolling for large datasets

---

*This documentation provides a comprehensive overview of the Pipeline Dashboard system architecture. For specific implementation details, refer to the individual component and service documentation.*</content>
<parameter name="filePath">/workspaces/pipeline-dashboard/docs/SYSTEM_ARCHITECTURE.md