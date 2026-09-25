import jsPDF from "jspdf";
import { TranscriptSegment } from "@/types";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function exportToMarkdown(segments: TranscriptSegment[], meetingTitle: string = "Meeting Transcript") {
  let md = `# ${meetingTitle}\n\n`;
  for (const seg of segments) {
    const time = formatTime(seg.start_time);
    md += `**${seg.speaker_name}** [${time}]\n${seg.text}\n\n`;
  }
  
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${meetingTitle.replace(/\s+/g, '_')}_Transcript.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToPDF(segments: TranscriptSegment[], meetingTitle: string = "Meeting Transcript") {
  const doc = new jsPDF();
  let y = 15;
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(meetingTitle, 15, y);
  y += 12;
  
  doc.setFontSize(11);
  
  for (const seg of segments) {
    const time = formatTime(seg.start_time);
    const header = `${seg.speaker_name} [${time}]`;
    
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 15;
    }
    
    doc.setFont("helvetica", "bold");
    doc.text(header, 15, y);
    y += 6;
    
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(seg.text, 180);
    
    for (const line of lines) {
      if (y > pageHeight - 15) {
        doc.addPage();
        y = 15;
      }
      doc.text(line, 15, y);
      y += 6;
    }
    y += 4; // space between segments
  }
  
  doc.save(`${meetingTitle.replace(/\s+/g, '_')}_Transcript.pdf`);
}
