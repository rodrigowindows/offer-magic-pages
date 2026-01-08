# Template Preview Page

## Overview
The Template Preview page (`/marketing/templates`) displays all available templates with actual property data and offer links for SMS and email campaigns.

## Features

### 🔍 **Template Preview with Real Data**
- Shows all templates rendered with actual property information
- Displays generated offer links for each property
- Includes QR code URLs for email templates
- Real-time variable substitution (`{name}`, `{address}`, `{cash_offer}`, etc.)

### 📋 **Property Selection**
- Dropdown to select from approved properties
- Shows property details (address, owner, offer amount)
- Loads first 10 approved properties for preview

### 🔗 **Offer Links & QR Codes**
- **Property URLs**: `https://offer.mylocalinvest.com/property/{id}?source=template_preview&template={template_id}`
- **QR Code URLs**: Generated QR codes linking to property pages
- Copy-to-clipboard functionality for all links
- Open-in-new-tab buttons for testing

### 📱 **Multi-Channel Support**
- **SMS**: Character count and message preview
- **Email**: Subject line and HTML body preview
- **Call**: Voicemail script preview

### 🎯 **Template Management**
- Displays all available templates from the template store
- Shows template metadata (name, description, channel)
- Organized by template type with appropriate icons

## Usage

1. Navigate to `/marketing/templates`
2. Select a property from the dropdown
3. View all templates rendered with that property's data
4. Copy offer links or template content as needed
5. Test links by clicking the external link buttons

## Technical Details

- Loads approved properties from Supabase
- Uses template store for available templates
- Generates tracking URLs with template and property IDs
- Supports all template variables from the marketing system
- Responsive design with mobile-friendly interface

## URL Structure
- **Property Offer Link**: `{website}/property/{property_id}?source=template_preview&template={template_id}`
- **QR Code**: Generated via QR Server API with property URL

This page is essential for:
- Previewing campaign content before sending
- Testing offer links and QR codes
- Copying template content for manual sending
- Quality assurance of template rendering