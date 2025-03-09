export const webInstructions = `
    A. USER HAVE NOT SIGNED IN YET
        1. How to Sign In 
            - Open the Sign-In Page
                + Navigate to the HealthMate website or open the mobile app.
                + Click on the "Sign In" button if you're on the homepage.
            - Enter Your Credentials
                + In the Email field, type your registered email address.
                + In the Password field, enter your account password.
                + If you're using a personal device, you can check the "Remember me?" box to stay signed in.
            - Recover Your Password (If Needed)
                + If you forgot your password, click on "Forgot Password".
                + Follow the instructions to reset your password via email.
            - Sign In: Click the "Sign In" button to access your account.
            - Alternative Sign-In Options: If you prefer, you can sign in using your Google or Facebook account by clicking on the respective icons.
            - Don't Have an Account Yet: Click "Sign Up" at the bottom of the form to create a new account.

        2. How to Sign Up for HealthMate
            - Open the Sign-Up Page
                + Go to the HealthMate website or open the mobile app.
                + Click on "Sign Up" if you are on the login page.
            - Fill in Your Information
                + Full Name
                    * Enter your real first name and last name as they appear on official documents.
                    * This is important for proper identification when booking appointments with doctors.
                + Username
                    * Choose a unique and easy-to-remember username.
                    * It should not contain special characters (e.g., @, !, #, $) and should be at least 5 characters long.
                    * Example: johnsmith123 ✅, john@smith ❌
                + Phone Number
                    * Provide a valid mobile number to receive important updates regarding your appointments.
                    * The number should include the country code if you are signing up internationally.
                    * Example: Viet Nam: 0123456789
                + Email Address
                    * Enter a working email address that you have access to.
                    * This email will be used for:
                    * Account verification
                    * Password recovery
                    * Appointment confirmations
                + Password
                    * Create a strong password that ensures account security.
                    * Your password should:
                        Be at least 8 characters long
                        Include uppercase & lowercase letters
                        Contain at least one number (0-9)
                        Include one special character (!@#$%^&*)
                    * Example: HealthMate@2024 ✅, password123 ❌
                + Confirm Password
                    Re-enter the password exactly as you typed it above.
                    Make sure there are no typos or extra spaces.
                    If the passwords do not match, you will need to re-enter them.
            - Select Your Role & Gender
                + Choose your role (Patient, Doctor, or Admin) from the dropdown.
                + Select your Gender from the available options.
            - Upload a Profile Photo (Optional): Click on "Upload Photo" and select a square (1:1) profile image.
            - Choose an Authentication Method: Select either Email Authenticator or SMS Authenticator for account security.
            - Agree to the Terms: Check the box to agree with the Terms of Use.
            - Complete the Registration: Click the "Sign Up" button to create your account.
            - Alternative Sign-Up Options: You can also sign up using Google or Facebook by clicking on their icons.
            - Already Have an Account: Click "Sign In" at the bottom of the form to log in.
    
    B. USER HAS SIGNED IN
        1. General Instructions for All Users:
            - Viewing Doctor Information:
                + To view detailed information about doctors, go to the top navigation bar and click on “Doctors.” This will show you a list of all doctors. You can search for doctors by name or specialty. To see more details about a specific doctor, click on the arrow at the bottom right of their profile card. You will find information about their education, work experience, and specialties.
                + You can also read and leave feedback for the doctor by selecting the “Feedback” tab.
                + The most important feature is the ability to book an appointment with the doctor. To do this, click on “Available Time Slots” on the doctor’s profile page. After selecting a time and completing the payment, your appointment will be confirmed.
                + Payment Options: You can pay either in cash or using an e-wallet. Currently, HealthMate only supports online payments through Stripe.
            - Viewing HealthMate Services:
                + To explore the services offered by HealthMate, click on the “Services” tab in the top navigation bar. This will show you all available services.
                + To learn more about a service and the doctors providing it, click on the service card. You can also see more services by clicking the “Load more” button.
            - Getting Help from Admin: If you need help or have any issues, click on the “Contact” tab in the top navigation bar. This will connect you to the support team for assistance.
            - Logging Out: There are two ways to log out:
                + Method 1: Move your mouse to your profile section (located next to the notification bell icon) in the top navigation bar. The logout icon will appear—click on it to log out.
                + Method 2: Go to your profile page by clicking on your profile section. At the bottom left of the profile page, you will find the logout option.


        2. Instructions for Patients (Role: ‘patient’):
            - Receiving Notifications:
                + Notifications about your appointment status and prescription updates from your doctor will be shown in real-time.
                + To view the details, click on the notification bell icon. Click on each notification to see the corresponding prescription details.
            - Viewing Your Profile and Appointments:
                + To access your profile, click on your profile section next to the notification bell icon.
                + On your profile page, you will see a list of your appointments. You can filter appointments by:
                    * Doctor’s name
                    * Date and time order (Newest to Oldest or Oldest to Newest)
                    * Appointment status (Pending, Done, or Cancelled)
                + Each appointment shows the doctor’s information, scheduled time, and current status. Click on an appointment to view detailed prescription information. However, prescriptions will not be shown for canceled appointments.
                + You can also edit your personal information and change your password on this page.


        3. Instructions for Doctors (Role: ‘doctor’):
            - Receiving Notifications:
                + You will receive real-time notifications when a patient books or cancels an appointment.
                + To view the details, click on the notification bell icon. Click on each notification to see the corresponding appointment details.
            - Managing Your Profile and Appointments:
                + To access your profile, click on your profile section next to the notification bell icon.
                + On your profile page, you will see several options:
                    * Overview: View your personal information.
                    * Appointments: View and manage your appointment list. You can filter appointments by:
                        # Patient’s name
                        # Date and time order (Newest to Oldest or Oldest to Newest)
                        # Appointment status (Pending, Done, or Cancelled)
                    * Profile Setting: Edit your personal information and update your availability to allow patients to book appointments with you.
            - Managing Prescriptions:
                + In the Appointments section, you can:
                    + View prescription details for each appointment.
                    + Two Modes of Prescription:
                        * Edit Mode: Update the prescription, including the disease name, medication details (name, dosage, and instructions), and additional notes.
                        * View Mode: Preview the prescription as the patient will see it.
                + You can also change your password and log out from your profile page.


        4. Instructions for Admins (Role: ‘admin’):
            - Receiving Notifications:
                + You will receive real-time notifications about support requests from users.
                + Click on the notification bell icon to view the details and follow up on the issue.
            - Accessing the Admin Dashboard: To access the admin dashboard, click on the profile section next to the notification bell icon. There are several key sections:
                4.1. Dashboard:
                    - View a summary of:
                        + Total number of patients and doctors
                        + Total number of appointments
                        + Overall revenue
                    - Additional statistics include:
                        + Top 3 highest-rated doctors
                        + User demographics (e.g., gender distribution)
                4.2. Doctor Management:
                    - View two sections:
                        + Pending Doctors: List of doctors awaiting approval to join HealthMate.
                        + Official Doctors: List of verified doctors currently accepting appointments.
                    - Click on the Analysis button on each doctor’s card to view their appointment statistics for the past year.
                4.3. Patient Management:
                    - View the list of all registered patients.
                    - Search for patients by name.
                4.4. Appointment Management:
                    - View the full list of appointments for all doctors and patients.
                    - Filter appointments by:
                        + Doctor’s name
                        + Patient’s name
                        + Date and time order (Newest to Oldest or Oldest to Newest)
                        + Appointment status (Pending, Done, or Cancelled)
                4.5. Revenue Tracking:
                    - View revenue reports by:
                        + Month
                        + Quarter
                        + Year
                    - Detailed revenue breakdown by each doctor for the past year.
    `;
