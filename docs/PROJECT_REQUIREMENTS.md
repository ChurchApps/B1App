# B1 Church - Project Requirements Document

## Overview

B1 Church is a comprehensive multi-tenant church management platform built with Next.js 15 that provides churches with a customizable website and mobile app. The platform integrates various church services and external resources into one unified platform, helping congregations stay connected through digital solutions.

## Mission Statement

Helping churches stay connected by providing a unified digital platform that integrates online giving, self-check-in, live streaming, member directory, and content management.

## Core Features

### 1. Multi-Tenant Architecture
- **Subdomain-based access**: Each church operates under its own subdomain (e.g., `churchname.b1.church`)
- **Dynamic routing**: `[sdSlug]` parameter system for church identification
- **Church-specific configuration**: Customizable settings, appearance, and functionality per church
- **Scalable infrastructure**: Supports unlimited church tenants

### 2. Content Management System
- **Drag-and-drop page builder**: Visual editor for creating custom pages
- **Pre-built page templates**: About, New Here, and other common church pages
- **Element library**: 20+ content elements including text, images, videos, forms, maps, calendars
- **Custom styling**: Church-specific themes, colors, fonts, and branding
- **Mobile-responsive design**: Optimized for all device types
- **SEO optimization**: Built-in metadata and search engine optimization

### 3. Live Streaming & Video Management
- **Multi-provider support**: YouTube, Vimeo, and custom streaming solutions
- **Interactive chat**: Real-time chat during live streams with moderation
- **Prayer requests**: Integrated prayer request system during services
- **Host controls**: Administrative controls for managing live streams
- **Video archives**: Sermon library and video content management
- **Stream scheduling**: Automated stream start/stop with countdown timers

### 4. Online Giving Platform
- **Secure payment processing**: Multiple payment gateway integration
- **Recurring donations**: Automated giving schedules
- **Donation tracking**: Member giving history and reporting
- **Multiple giving options**: One-time, recurring, and special campaigns
- **Mobile-optimized**: Seamless giving experience on all devices
- **Tax reporting**: Automated giving statements and receipts

### 5. Member Portal & Directory
- **Secure member authentication**: JWT-based authentication system
- **Personal profiles**: Member information management
- **Household management**: Family grouping and relationships
- **Directory search**: Searchable member directory with privacy controls
- **Personal timeline**: Activity feeds and church updates
- **Profile customization**: Privacy settings and visibility preferences

### 6. Group Management
- **Small group creation**: Tools for creating and managing small groups
- **Group scheduling**: Calendar integration for group meetings
- **Member management**: Add/remove members, assign leaders
- **Group resources**: File sharing and communication tools
- **Attendance tracking**: Session attendance and participation metrics
- **Leadership tools**: Administrative controls for group leaders

### 7. Event & Calendar Management
- **Event creation**: Comprehensive event management system
- **Recurring events**: Support for repeating events with RRULE standard
- **Multiple calendars**: Church-wide and group-specific calendars
- **Event registration**: Member sign-up and capacity management
- **Calendar integration**: Export to external calendar applications
- **Visual calendar views**: Month, week, and day view options

### 8. Check-in System
- **Self-service check-in**: Mobile and kiosk-based attendance tracking
- **Family check-in**: Household-based check-in process
- **Service selection**: Multiple service time options
- **Child safety**: Secure child check-in with parent verification
- **Attendance reporting**: Real-time attendance tracking and analytics
- **Print integration**: Name tags and security labels

### 9. Communication Tools
- **Messaging system**: Internal church communication platform
- **Announcements**: Church-wide and group-specific announcements
- **Email integration**: Automated email notifications and campaigns
- **Push notifications**: Mobile app notifications for important updates
- **Social features**: Timeline posts and community interaction
- **Direct messaging**: Private member-to-member communication

### 10. Administrative Dashboard
- **Multi-role permissions**: Configurable access levels for different users
- **Analytics and reporting**: Attendance, giving, and engagement metrics
- **User management**: Member accounts and permission management
- **Content moderation**: Tools for managing user-generated content
- **System configuration**: Church settings and feature toggles
- **Backup and recovery**: Data protection and recovery systems

## Technical Architecture

### Frontend Framework
- **Next.js 15**: React-based framework with App Router
- **TypeScript**: Type-safe development with strict configuration
- **Material-UI (MUI)**: Component library for consistent UI/UX
- **React DnD**: Drag-and-drop functionality for page builder
- **Responsive design**: Mobile-first approach with progressive enhancement

### Backend Integration
- **Microservices architecture**: Integration with 7 specialized APIs
  - MembershipApi: Church data, users, settings
  - ContentApi: Pages, navigation, styles
  - GivingApi: Donations, payment processing
  - AttendanceApi: Check-in and attendance tracking
  - MessagingApi: Communication features
  - DoingApi: Tasks and workflows
  - LessonsApi: Educational content
- **RESTful API**: Standardized API communication
- **JWT Authentication**: Secure token-based authentication
- **Caching strategy**: Optimized data fetching with cache invalidation

### Database & Storage
- **Cloud-based storage**: Scalable file and media storage
- **Data synchronization**: Real-time updates across all clients
- **Backup systems**: Automated data backup and recovery
- **GDPR compliance**: Data protection and privacy controls

### Security & Compliance
- **HTTPS encryption**: All communications encrypted in transit
- **Role-based access control**: Granular permission system
- **Data privacy**: GDPR and privacy law compliance
- **Secure payment processing**: PCI DSS compliant payment handling
- **Regular security audits**: Ongoing security assessment and updates

## User Personas

### 1. Church Leadership
- **Pastors and staff**: Content creation, member management, analytics
- **Administrative staff**: Day-to-day operations, member support
- **Volunteers**: Limited access for specific responsibilities

### 2. Church Members
- **Active members**: Full access to member portal and features
- **Visitors**: Limited access to public content and giving
- **Group leaders**: Enhanced permissions for group management

### 3. Technical Users
- **Web administrators**: Site customization and technical configuration
- **Content creators**: Page building and content management
- **Moderators**: Community management and content moderation

## Internationalization
- **Multi-language support**: 12 supported locales
- **Localized content**: Region-specific content and formatting
- **RTL support**: Right-to-left language compatibility
- **Currency support**: Multiple currency options for international churches

## Mobile Experience
- **Progressive Web App (PWA)**: Native app-like experience
- **Offline capabilities**: Limited functionality without internet
- **Push notifications**: Engagement and communication features
- **Touch-optimized**: Designed for mobile interaction patterns
- **App store presence**: Available through web browsers

## Performance Requirements
- **Page load speed**: <3 seconds for optimal user experience
- **Scalability**: Support for churches with 10,000+ members
- **Uptime**: 99.9% availability SLA
- **Mobile performance**: Optimized for low-bandwidth connections
- **CDN integration**: Global content delivery network

## Analytics & Reporting
- **Member engagement**: Participation and activity metrics
- **Giving analytics**: Donation trends and campaign performance
- **Attendance tracking**: Service and event attendance data
- **Content performance**: Page views and engagement metrics
- **Custom reports**: Configurable reporting for church leadership

## Integration Capabilities
- **Third-party APIs**: Support for external service integration
- **Social media**: Facebook, Instagram, and Twitter integration
- **Email platforms**: Mailchimp, Constant Contact integration
- **Calendar systems**: Google Calendar, Outlook synchronization
- **Payment processors**: Stripe, PayPal, and other gateway support

## Deployment & Hosting
- **Cloud hosting**: Scalable cloud infrastructure
- **Environment management**: Development, staging, and production environments
- **Continuous deployment**: Automated testing and deployment pipeline
- **Monitoring**: Real-time system monitoring and alerting
- **Documentation**: Comprehensive developer and user documentation

## Success Metrics
- **User adoption**: Monthly active users and engagement rates
- **Feature utilization**: Adoption of key platform features
- **Performance metrics**: Page load times and system reliability
- **User satisfaction**: Feedback scores and support ticket volume
- **Revenue growth**: Subscription and donation processing volume

## Future Roadmap
- **AI-powered features**: Automated content generation and recommendations
- **Enhanced mobile app**: Native iOS and Android applications
- **Advanced analytics**: Predictive analytics and member insights
- **Integration marketplace**: Third-party plugin ecosystem
- **White-label solutions**: Branded platform for church networks

## Compliance & Standards
- **Web accessibility**: WCAG 2.1 AA compliance
- **Data protection**: GDPR, CCPA, and other privacy regulations
- **Financial compliance**: PCI DSS for payment processing
- **Religious freedom**: Respectful handling of diverse beliefs and practices
- **Industry standards**: Following best practices for church management software

---

*This document serves as the comprehensive requirements specification for the B1 Church platform. It should be regularly updated to reflect new features, changes in requirements, and platform evolution.*