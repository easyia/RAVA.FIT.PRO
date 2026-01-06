
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { EvolutionReportTemplate } from '@/components/reports/EvolutionReportTemplate';
import { DietReportTemplate } from '@/components/reports/DietReportTemplate';
// We need to fetch data before calling this service, or pass data to it.
// The plan says `generateEvolutionReport(data: EvolutionReportData)`

export interface EvolutionReportData {
    student: any;
    coach: any;
    assessments: any[];
    feedbacks: any[];
    // metrics?
}

export const generateEvolutionReport = async (data: EvolutionReportData) => {
    // 1. Create a hidden container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-10000px';
    container.style.left = '-10000px';
    container.style.width = '210mm'; // A4 width
    // container.style.minHeight = '297mm'; // A4 height
    container.style.backgroundColor = '#ffffff'; // Ensure white background for PDF
    document.body.appendChild(container);
    let root: any = null;
    try {
        // 2. Mount the component
        root = createRoot(container);

        // Wrap in a promise to wait for render
        await new Promise<void>((resolve) => {
            // We use a longer timeout only for the first render to ensure charts are ready
            root.render(<EvolutionReportTemplate data={data} />);

            // Wait for charts/images to load. 
            // 2s is safer for complex charts without animations.
            setTimeout(resolve, 2000);
        });

        // 3. CAPTURE PAGES INDIVIDUALLY
        // Instead of capturing the whole container (which might be huge),
        // we capture only elements with .print-page class.
        const pages = container.querySelectorAll('.print-page');
        const pdf = new jsPDF('p', 'mm', 'a4');

        if (pages.length > 0) {
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i] as HTMLElement;
                if (i > 0) pdf.addPage();

                const pageCanvas = await html2canvas(page, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    windowWidth: 794, // Fixed A4 width in pixels (~210mm at 96dpi)
                });

                const pImgData = pageCanvas.toDataURL('image/png', 0.8); // 0.8 quality to save memory
                pdf.addImage(pImgData, 'PNG', 0, 0, 210, 297);
            }
        } else {
            // Fallback for single page capture if no .print-page found
            const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
        }

        // 4. Save
        const studentName = data.student?.full_name || data.student?.name || 'Aluno';
        pdf.save(`Relatorio_Evolucao_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error("PDF Generation failed", error);
        throw error;
    } finally {
        // 5. Cleanup
        if (root) {
            try {
                root.unmount();
            } catch (e) {
                console.warn("Root unmount failed", e);
            }
        }
        if (container.parentNode) {
            document.body.removeChild(container);
        }
    }
};

export interface DietReportData {
    student: any;
    plan: any;
    coach: any;
}

export const generateDietReport = async (data: DietReportData) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-10000px';
    container.style.left = '-10000px';
    container.style.width = '210mm';
    container.style.backgroundColor = '#ffffff';
    document.body.appendChild(container);

    let root: any = null;

    try {
        root = createRoot(container);
        await new Promise<void>((resolve) => {
            root.render(<DietReportTemplate data={data} />);
            setTimeout(resolve, 1500);
        });

        // Capture the FULL content at real size
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: 794, // A4 width in pixels at 96 DPI
        });

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm

        // Calculate dimensions
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;

        // If content fits in one page, just add it
        if (imgHeight <= pageHeight) {
            const imgData = canvas.toDataURL('image/png', 0.95);
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        } else {
            // Multi-page: slice the canvas into A4-sized chunks
            // Calculate how many pixels correspond to one A4 page height
            const pixelsPerPage = (pageHeight / imgWidth) * canvas.width;
            const totalPages = Math.ceil(canvas.height / pixelsPerPage);

            for (let page = 0; page < totalPages; page++) {
                if (page > 0) pdf.addPage();

                // Calculate the portion of the canvas to capture for this page
                const sourceY = page * pixelsPerPage;
                const sourceHeight = Math.min(pixelsPerPage, canvas.height - sourceY);

                // Create a new canvas for this page slice
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = canvas.width;
                pageCanvas.height = sourceHeight;

                const ctx = pageCanvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
                    ctx.drawImage(
                        canvas,
                        0, sourceY, canvas.width, sourceHeight, // source
                        0, 0, pageCanvas.width, sourceHeight // destination
                    );
                }

                // Calculate the actual height this slice represents in mm
                const sliceHeightMm = (sourceHeight * pageWidth) / canvas.width;

                const pageImgData = pageCanvas.toDataURL('image/png', 0.95);
                pdf.addImage(pageImgData, 'PNG', 0, 0, pageWidth, sliceHeightMm);
            }
        }

        const studentName = data.student?.full_name || data.student?.name || 'Aluno';
        pdf.save(`Plano_Alimentar_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error("Diet PDF Generation failed", error);
        throw error;
    } finally {
        if (root) {
            try { root.unmount(); } catch (e) { /* ignore */ }
        }
        if (container.parentNode) {
            document.body.removeChild(container);
        }
    }
};

