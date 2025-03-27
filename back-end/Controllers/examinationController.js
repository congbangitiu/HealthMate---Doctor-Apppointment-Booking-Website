import Booking from '../Models/BookingSchema.js';
import Examination from '../Models/ExaminationSchema.js';
import PDFDocument from 'pdfkit';
import axios from 'axios';

export const createExamination = async (req, res) => {
    try {
        const booking = await Booking.findById(req.body.appointment);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        const newExamination = new Examination({
            ...req.body,
        });
        await newExamination.save();

        res.status(201).json({
            success: true,
            message: 'Examination created successfully',
            data: newExamination,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating examination',
            error: error.message,
        });
    }
};

export const getExaminationByAppointmentId = async (req, res) => {
    const { appointmentId } = req.params;
    try {
        const examination = await Examination.findOne({ appointment: appointmentId });
        if (!examination) {
            return res.status(404).json({ success: false, message: 'Examination not found' });
        }
        res.status(200).json({ success: true, data: examination });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const updateExaminationByAppointmentId = async (req, res) => {
    const { appointmentId } = req.params;
    try {
        const updatedExamination = await Examination.findOneAndUpdate(
            { appointment: appointmentId },
            {
                $set: req.body,
                $push: { actionHistory: { action: 'update', timestamp: new Date() } },
            },
            { new: true, runValidators: true },
        );

        if (!updatedExamination) {
            return res.status(404).json({ success: false, message: 'Examination not found' });
        }

        // Get the booking details
        const booking = await Booking.findById(req.body.appointment).populate('user doctor');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Examination updated successfully',
            data: updatedExamination,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const getExaminationPDF = async (req, res) => {
    try {
        // Extract the appointment ID from the request parameters
        const { id } = req.params;

        // Find the examination record by appointment ID
        const examination = await Examination.findOne({ appointment: id });
        if (!examination) {
            return res.status(404).json({ success: false, message: 'Examination not found' });
        }

        // Find the appointment to get user and doctor information
        const appointment = await Booking.findById(id).populate('user doctor');
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Initialize a new PDF document with A4 size and 40mm margins
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const buffers = [];
        // Collect PDF data chunks into buffers
        doc.on('data', buffers.push.bind(buffers));
        // When PDF generation is complete, send the PDF as a response
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="HEALTHMATE_EXAMINATION_${appointment.user.fullname}.pdf"`,
            });
            res.send(pdfData);
        });

        // Add the title of the examination form
        doc.fontSize(20).fillColor('#00c4cc').text('EXAMINATION FORM', { align: 'center' });
        doc.moveDown(1); // Add some vertical spacing

        // Add patient information section
        doc.fontSize(12).fillColor('black');
        doc.text(`Patient's full name: ${appointment.user.fullname}`, { align: 'left' });
        doc.text(`Date of birth: ${appointment.user.dateOfBirth}`, { align: 'left' });
        doc.text(`Gender: ${appointment.user.gender}`, { align: 'left' });
        doc.text(`Address: ${appointment.user.address}`, { align: 'left' });
        doc.text(`Phone number: 0${appointment.user.phone}`, { align: 'left' });
        doc.moveDown(1); // Add spacing after patient info

        // Add examination details section
        doc.text(`Chief Complaint: ${examination.chiefComplaint}`, { align: 'left' });
        doc.text(`Clinical Indications: ${examination.clinicalIndications}`, { align: 'left' });
        doc.text(`Ultrasound Request: ${examination.ultrasoundRequest.join(', ')}`, { align: 'left' });
        doc.moveDown(1); // Add spacing after examination details

        // Add Ultrasound Results section
        doc.fontSize(14).fillColor('#00c4cc').text('Ultrasound Results', { align: 'left' });
        doc.fontSize(12).fillColor('black');
        // Loop through ultrasound results and add each organ and its result
        Object.entries(examination.ultrasoundResults).forEach(([organ, result]) => {
            doc.text(`${organ}: ${result}`, { align: 'left' });
        });
        doc.moveDown(1); // Add spacing after ultrasound results

        // Add Ultrasound Photos section if there are photos
        if (examination.ultrasoundPhotos && examination.ultrasoundPhotos.length > 0) {
            doc.fontSize(14).fillColor('#00c4cc').text('Ultrasound Photos', { align: 'left' });
            doc.moveDown(0.5); // Add a small space before photos

            let x = 40; // Starting x position for images
            let y = doc.y; // Current y position
            const maxWidth = 150; // Maximum width for each image
            const maxHeight = 150; // Maximum height for each image
            const imagesPerRow = 3; // Number of images per row
            let imageCount = 0; // Counter for images

            // Loop through each photo URL
            for (const photoUrl of examination.ultrasoundPhotos) {
                try {
                    // Fetch the image from the URL as a buffer
                    const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    // Add the image to the PDF at the current position
                    doc.image(imageBuffer, x, y, { fit: [maxWidth, maxHeight] });

                    // Update position for the next image
                    imageCount++;
                    x += maxWidth + 10; // Add spacing between images

                    // If the row is full, move to the next row
                    if (imageCount % imagesPerRow === 0) {
                        x = 40; // Reset x position
                        y += maxHeight + 10; // Move to the next row
                    }

                    // If the y position exceeds the page height, add a new page
                    if (y + maxHeight > doc.page.height - 40) {
                        doc.addPage();
                        x = 40;
                        y = 40;
                    }
                } catch (error) {
                    // Log error and display a placeholder if the image fails to load
                    console.error(`Error loading image ${photoUrl}:`, error);
                    doc.text(`[Error loading image: ${photoUrl}]`, x, y);
                    x += maxWidth + 10;
                    if (imageCount % imagesPerRow === 0) {
                        x = 40;
                        y += maxHeight + 10;
                    }
                }
            }

            // Update y position after adding images
            if (imageCount % imagesPerRow !== 0) {
                y += maxHeight + 10;
            }
            doc.y = y;
            doc.moveDown(1); // Add spacing after photos
        }

        // Add confirmation section with HealthMate and doctor information
        doc.fontSize(12).fillColor('black');
        doc.text(
            `HealthMate${examination.updatedAt ? ', ' + new Date(examination.updatedAt).toLocaleDateString() : ''}`,
            { align: 'left' },
        );
        doc.text(`Doctor: ${appointment.doctor.fullname}`, { align: 'left' });

        // Finalize the PDF document
        doc.end();
    } catch (error) {
        // Handle errors during PDF generation
        res.status(500).json({
            success: false,
            message: 'Error generating PDF',
            error: error.message,
        });
    }
};
