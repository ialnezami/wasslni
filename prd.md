# Product Requirements Document (PRD)

# Covoiture – Arabic Carpooling Platform (BlaBlaCar Style)

**Version:** 1.0
**Status:** Draft
**Target Market:** Arabic-speaking countries (Morocco, Algeria, Tunisia, Egypt, Saudi Arabia, UAE, Jordan, etc.)
**Platform:** Web (Phase 1), Mobile Ready API (Phase 2)

---

# 1. Product Overview

Covoiture is a ride-sharing platform similar to BlaBlaCar where drivers can publish trips between cities and passengers can reserve seats.

The application is designed primarily for Arabic users with RTL (Right-to-Left) support.

Example:

Driver:

* Casablanca → Rabat
* Departure: 08:00
* Price: 80 MAD
* Seats: 3

Passengers search for trips and request to join.

---

# 2. Goals

### Business Goals

* Easy ride publishing
* Safe passenger booking
* Reduce transportation costs
* Admin moderation
* Arabic-first experience

---

# 3. Users

## Passenger

Can

* Register
* Login
* Search rides
* View driver profile
* Book seat
* Cancel booking
* View booking history

---

## Driver

Can

* Register
* Verify phone
* Create ride
* Edit ride
* Cancel ride
* Accept/Reject passengers
* View bookings

---

## Administrator

Can

* Manage users
* Ban users
* Delete users
* Manage rides
* Delete inappropriate rides
* View statistics
* Manage cities
* Manage reports

---

# 4. Technology Stack

## Monorepo

```
covoiture/

├── apps/
│
├── backend/
│   NestJS
│
├── frontend/
│   ReactJS
│
├── packages/
│
├── shared/
│
├── docker/
│
├── docs/
│
└── README.md
```

---

# Backend

* NestJS
* MongoDB
* Mongoose
* JWT Authentication
* Passport
* Swagger
* Class Validator
* Multer
* Socket.io (future)
* Redis (future)

---

# Frontend

* ReactJS
* React Router
* React Query
* Axios
* TailwindCSS
* React Hook Form
* Zod
* i18next
* RTL Support

---

# Database

MongoDB

Collections:

```
users
rides
bookings
cities
reports
notifications
```

---

# Authentication

* JWT
* Refresh Token
* Email verification (optional)
* Phone verification (future)

---

# Roles

```
Admin
Driver
Passenger
```

---

# User Flow

Register

↓

Login

↓

Complete profile

↓

Search trip

↓

Book seat

↓

Driver approves

↓

Ride completed

---

# Driver Flow

Login

↓

Create Ride

↓

Choose

* Departure City
* Destination City
* Date
* Departure Time
* Departure Point
* Available Seats
* Price

↓

Publish

↓

Receive booking requests

↓

Approve passengers

---

# Passenger Flow

Home

↓

Search

↓

Choose cities

↓

Date

↓

Search

↓

Available rides

↓

Ride Details

↓

Book

↓

Waiting approval

↓

Confirmed

---

# Admin Flow

Dashboard

↓

Users

↓

Drivers

↓

Passengers

↓

Trips

↓

Bookings

↓

Reports

↓

Statistics

---

# Functional Requirements

## Authentication Module

Features

* Register
* Login
* Logout
* Forgot Password
* Reset Password
* JWT

---

## Profile Module

Fields

```
Full Name

Phone

Email

Photo

Gender

Date of Birth

Preferred Language

Bio
```

---

# Cities Module

Admin manages all cities.

Fields

```
Name Arabic

Name French

Latitude

Longitude
```

---

# Ride Module

Driver creates ride.

Fields

```
Driver

Departure City

Destination City

Departure Point

Destination Point

Date

Departure Time

Price

Seats Available

Vehicle

Description

Status
```

Status

```
Scheduled

Full

Completed

Cancelled
```

---

# Booking Module

Passenger books ride.

Fields

```
Ride

Passenger

Seats

Booking Status

Payment Status
```

Booking Status

```
Pending

Accepted

Rejected

Cancelled
```

---

# Vehicle Module

Each driver can own multiple vehicles.

Fields

```
Brand

Model

Year

Color

License Plate

Seats
```

---

# Search Module

Passenger can search using:

* Departure City
* Destination City
* Date
* Price Range
* Departure Time
* Available Seats

Sorting

* Cheapest
* Earliest
* Latest
* Highest Rated

---

# Notifications

Notifications for

* Booking received
* Booking approved
* Booking rejected
* Ride cancelled
* Ride reminder

---

# Reviews

Passenger rates driver

Driver rates passenger

Rating

```
1-5 Stars
```

Comment

---

# Reports

Passengers can report

* Driver
* Passenger
* Ride

Reasons

```
Spam

Fraud

Unsafe

Other
```

---

# Admin Dashboard

## Statistics

Cards

* Total Users
* Drivers
* Passengers
* Active Trips
* Completed Trips
* Revenue (future)

Charts

* Trips per Month
* Users Growth
* Top Cities

---

# API Modules (NestJS)

```
Auth Module

Users Module

Drivers Module

Passengers Module

Cities Module

Vehicles Module

Rides Module

Bookings Module

Reviews Module

Reports Module

Notifications Module

Admin Module
```

---

# MongoDB Collections

## Users

```
_id

fullName

email

phone

password

role

photo

rating

createdAt
```

---

## Ride

```
_id

driverId

departureCityId

destinationCityId

departurePoint

destinationPoint

date

departureTime

price

availableSeats

vehicleId

description

status
```

---

## Booking

```
_id

rideId

passengerId

status

paymentStatus

createdAt
```

---

## City

```
_id

nameAr

nameFr

lat

lng
```

---

## Vehicle

```
_id

driverId

brand

model

year

color

plate

seats
```

---

# Frontend Pages

## Public

* Home
* Search
* Ride Details
* Login
* Register
* About
* Contact

---

## Passenger

* Dashboard
* My Bookings
* Notifications
* Profile
* Reviews

---

## Driver

* Dashboard
* My Rides
* Create Ride
* Edit Ride
* Booking Requests
* Vehicles
* Earnings (future)

---

## Admin

* Dashboard
* Users
* Drivers
* Passengers
* Cities
* Trips
* Reports
* Reviews
* Settings

---

# Folder Structure

```
covoiture/

apps/
│
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── rides/
│   │   ├── bookings/
│   │   ├── vehicles/
│   │   ├── cities/
│   │   ├── reviews/
│   │   ├── reports/
│   │   ├── notifications/
│   │   ├── admin/
│   │   ├── common/
│   │   └── main.ts
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── routes/
│   │   ├── types/
│   │   ├── utils/
│   │   └── main.tsx
│
packages/
│
├── shared-types/
├── shared-ui/
├── shared-config/
│
docs/
docker/
```

---

# Security

* JWT Authentication
* Password hashing (bcrypt)
* Helmet
* CORS
* Request validation
* Rate limiting
* Input sanitization
* Audit logging for admin actions

---

# Future Features

* Mobile apps (React Native)
* Online payments (Stripe, PayPal, regional gateways)
* Live GPS tracking
* Real-time chat (WebSocket)
* Push notifications
* Driver identity verification
* Ride history analytics
* Coupons and promotions
* Multi-language (Arabic, French, English)
* Favorite routes
* Emergency/SOS button
* AI-based ride recommendations

---

# MVP Scope (Phase 1)

**Must Have**

* User registration and login
* Driver and passenger roles
* Driver profile and vehicle management
* Create, edit, and cancel rides
* Search rides by city and date
* Book and manage seats
* Booking approval workflow
* Admin dashboard
* User, ride, and city management
* Arabic RTL interface
* JWT authentication
* MongoDB database
* NestJS REST API
* ReactJS frontend in a single monorepo

This architecture provides a scalable foundation that supports future mobile applications and additional services while keeping the backend and frontend together in a single monorepo.

