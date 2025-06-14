import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generateAndDownloadPDF = async (elementId, fileName, setLoading = null) => {
    if (setLoading) setLoading(true);

    try {
        const input = document.getElementById(elementId);
        const canvas = await html2canvas(input, {
            useCORS: true,
            onclone: (clonedDoc) => {
                clonedDoc.getElementById(elementId).style.display = 'block';
            },
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        const imgWidth = 180;
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 15;
        pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(fileName);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    } finally {
        if (setLoading) setLoading(false);
    }
};

export const generatePDFBlob = async (elementId) => {
    const input = document.getElementById(elementId);
    const canvas = await html2canvas(input, {
        useCORS: true,
        scale: 1.5,
        quality: 0.8,
        onclone: (clonedDoc) => {
            clonedDoc.getElementById(elementId).style.display = 'block';
        },
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgWidth = 180;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 15;
    pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
    }

    return pdf.output('blob');
};
