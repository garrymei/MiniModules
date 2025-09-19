# MiniModules Platform

## Overview

MiniModules is a modular microservices platform designed for building WeChat mini-programs with multi-tenant support across different industries. The platform follows a module-based architecture where business functionalities (ordering, booking, user management, etc.) are implemented as independent, configurable modules. Each tenant can enable specific modules and customize their configuration, themes, and branding to create industry-specific applications like restaurants, booking services, or e-commerce platforms.

The system consists of three main components: a WeChat mini-program frontend, a Vue.js admin dashboard, and a Node.js backend API service, all sharing common libraries and module specifications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Mobile Application**: WeChat mini-program built with TypeScript, using a modular loading system that dynamically configures available features based on tenant settings
- **Admin Dashboard**: Vue 3 application with Element Plus UI components, Pinia for state management, and Vite as the build tool for managing tenant configurations and modules

### Backend Architecture  
- **API Service**: Express.js REST API with TypeScript, providing tenant configuration management, module orchestration, and business logic endpoints
- **Modular Design**: Each business function (ordering, booking, user management) is implemented as a separate module with its own routes, services, and configuration schema
- **Multi-tenant Support**: Tenant-specific configurations stored and retrieved via API endpoints, allowing different industries to customize functionality

### Data Storage Solutions
- **PostgreSQL**: Primary database for storing tenant configurations, user data, and business entities
- **Redis**: Caching layer for session management and frequently accessed tenant configurations

### Module System
- **Module Specifications**: JSON-based configuration files defining routes, permissions, dependencies, and configuration schemas for each module
- **Dynamic Loading**: Modules are loaded based on tenant configuration, with support for industry-specific templates and themes
- **Shared Libraries**: Common TypeScript types, utilities, and module specifications shared across all services

### Authentication & Authorization
- **JWT-based Authentication**: Token-based authentication for API access
- **WeChat Integration**: Native WeChat login support for mini-program users  
- **Role-based Permissions**: Module-level permissions supporting customer, staff, and admin roles

## External Dependencies

### Core Technologies
- **Node.js 18+**: Runtime environment for backend services
- **TypeScript**: Primary programming language across all packages
- **pnpm**: Package manager with workspace support for monorepo structure

### Frontend Dependencies
- **Vue 3**: Progressive framework for admin dashboard
- **Element Plus**: UI component library for administrative interfaces
- **Vite**: Frontend build tool and development server
- **WeChat Mini-program APIs**: Native WeChat development platform

### Backend Dependencies
- **Express.js**: Web framework for REST API services
- **PostgreSQL (pg)**: Database driver for primary data storage
- **Redis**: In-memory data store for caching and sessions
- **bcryptjs**: Password hashing for user authentication
- **jsonwebtoken**: JWT implementation for authentication tokens
- **Joi**: Schema validation for API requests

### Development Tools
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Docker**: Containerization for development and deployment
- **GitHub Actions**: CI/CD pipeline automation