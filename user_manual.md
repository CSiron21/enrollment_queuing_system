# HAU Enrollment Queuing System - User Manual

Welcome to the HAU Enrollment Queuing System! This guide is divided into two parts: a guide for **Students** registering for enrollment, and a guide for **Administrators** managing the queue.

---

# Part 1: Student Guide

## 1. Before You Register (Geofencing)
To ensure fairness, this system uses GPS Geofencing. You **cannot** join the queue from your home. You must be physically present on the HAU Campus to register. 

When you open the registration page, your browser will ask for Location Permissions. **You must click "Allow"**, or the system will block your registration.

## 2. How to Join the Queue
1. Open the enrollment website on your smartphone or laptop.
2. Click the **Join Queue** button on the homepage.
3. Fill out the registration form:
   * **Course:** Select your intended course (e.g., BSCS, BSIT).
   * **Year Level:** Select your incoming year level.
   * **Enrollment Type:** Select if you are a **Block Section** or **Irregular** student.
   * **Student Name:** Enter your full name.
   * **Student ID:** Enter your exact 8-digit student ID.
4. Complete the Cloudflare Bot Verification checkbox.
5. Click **Join Queue**.

*Note: You can only join one queue at a time. If you try to register twice, the system will redirect you to your existing queue ticket.*

## 3. Tracking Your Status
Once registered, you will be taken to your **Live Queue Ticket**. This page updates automatically. Do not close this tab until you are finished enrolling.

*   **Your Queue Number:** Displayed in large text at the top.
*   **Now Serving:** Shows the number currently being accommodated at the encoding room.
*   **People Ahead of You:** Shows how many students are waiting before your turn.

**Important Tips:**
*   Take a screenshot of this page just in case you accidentally close your browser!
*   If you lock your phone or switch to another app, the page will pause its live updates to save your battery. When you open it again, it will instantly refresh.

## 4. The No-Show Policy ⚠️
When your number matches the "Now Serving" number, your status will change to **"Please proceed to the encoding room."** 

If you fail to show up when your number is called, the administrator will mark you as a **No-Show** and you will be **removed from the queue**. If this happens, your ticket will display a red "Removed" warning, and you will be forced to register again and go to the very back of the line. Do not wander far!

## 5. How to Find Your Queue (If you closed the tab)
If you accidentally close your browser tab, don't panic! You have not lost your spot.
1. Go back to the website homepage.
2. Click **Find Queue**.
3. Enter your 8-digit Student ID and pass the bot check.
4. Click **Find Queue**. The system will instantly reconnect you to your live queue ticket.

---

# Part 2: Administrator Guide

## 1. Accessing the Dashboard
1. Navigate to `[your-website-url]/admin`.
2. Log in using your authorized IT staff email and password.
3. Upon successful login, you will be taken to the **Admin Dashboard**.

## 2. Setting up Schedules
Before students can queue, an administrator must create an active schedule. If there are no active schedules, the public Queue Board will be empty, and students will not be able to register.

1. On the dashboard sidebar, click **Manage Schedules**.
2. Click **Add New Schedule**.
3. Select the **Enrollment Type** (Block Section or Irregular) and **Year Level**.
4. Set the Date, Start Time, and End Time.
5. Check the **Is Active** box to turn this queue ON. 
6. Click **Save**.

*Note: You can toggle queues ON and OFF at any time by editing the schedule and checking/unchecking the "Is Active" box.*

## 3. Managing the Queue Operations
On the main dashboard, you will see a grid of all active queues (e.g., "1st Year Block Section", "3rd Year Irregular"). 

Click on any queue card to open its control panel.

### Actions Panel
*   **Call Next:** Calls the next batch of waiting students. You can select how many students to call at once (1, 3, or 5) using the dropdown next to the button. Their status will change to "Serving".
*   **Complete All Serving:** Instantly marks everyone currently at the "Serving" desk as finished.

### Individual Student Actions
Below the control buttons, you will see a list of all students in that specific queue. You can perform actions on individual students:

| Button | What it does | When to use it |
| :--- | :--- | :--- |
| **Complete** | Marks the student as officially enrolled. | The student has finished their transaction at the desk. |
| **Skip** | Temporarily skips the student but keeps them in the queue. | The student is missing a document or needs to step aside momentarily. They retain their original queue number. |
| **Delete** | Removes the student from the queue entirely. | The student is a **No-Show** when called, or they registered by mistake. They will have to register again from scratch. |

## 4. Understanding Statuses
You will see colored badges next to student names:
*   🟢 **Waiting:** In line, waiting to be called.
*   🔵 **Serving:** Called to the desk.
*   🟠 **In Progress:** (Previously "Skipped"). Currently at the desk but temporarily stepped aside.
*   ⚪ **Completed:** Finished enrollment.
*   🔴 **Removed:** Deleted/No-Show (You will only see this in the database; they are hidden from the active dashboard to keep it clean).

## 5. The Public Queue Board
If you have a TV monitor in the waiting area, open a web browser and navigate to `[your-website-url]/queue`. 

This is the **Public Queue Board**. It automatically updates in real-time and flashes green whenever a new number is called. It requires no login and no manual refreshing.
