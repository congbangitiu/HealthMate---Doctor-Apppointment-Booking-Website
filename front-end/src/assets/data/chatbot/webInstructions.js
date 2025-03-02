export const webInstructions = `
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
