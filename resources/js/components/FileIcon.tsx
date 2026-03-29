import { 
    FileText, 
    FileImage, 
    FileVideo, 
    FileAudio, 
    FileArchive, 
    FileCode, 
    FileQuestion,
    Folder
} from 'lucide-react';
import React from 'react';

interface FileIconProps {
    type: string;
    extension?: string;
    className?: string;
}

export default function FileIcon({ type, extension }: FileIconProps) {
    if (type === 'dir') {
        return (
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 shadow-sm transition-transform active:scale-95`}>
                <Folder className="h-5 w-5 fill-amber-500/20 text-amber-500" strokeWidth={2.5} />
            </div>
        );
    }

    const ext = extension?.toLowerCase();
    
    // Define color and icon mapping
    let icon = <FileQuestion className="h-5 w-5" strokeWidth={2.5} />;
    let colorClass = "bg-slate-50 text-slate-400";

    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'fig'].includes(ext || '')) {
        icon = <FileImage className="h-5 w-5 text-rose-500" strokeWidth={2.5} />;
        colorClass = "bg-rose-50 text-rose-500";
    } else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext || '')) {
        icon = <FileVideo className="h-5 w-5 text-indigo-500" strokeWidth={2.5} />;
        colorClass = "bg-indigo-50 text-indigo-500";
    } else if (['mp3', 'wav', 'ogg', 'flac'].includes(ext || '')) {
        icon = <FileAudio className="h-5 w-5 text-cyan-500" strokeWidth={2.5} />;
        colorClass = "bg-cyan-50 text-cyan-500";
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
        icon = <FileArchive className="h-5 w-5 text-blue-500" strokeWidth={2.5} />;
        colorClass = "bg-blue-50 text-blue-500";
    } else if (['pdf'].includes(ext || '')) {
        icon = <FileText className="h-5 w-5 text-red-500" strokeWidth={2.5} />;
        colorClass = "bg-red-50 text-red-500";
    } else if (['doc', 'docx', 'txt', 'rtf'].includes(ext || '')) {
        icon = <FileText className="h-5 w-5 text-blue-600" strokeWidth={2.5} />;
        colorClass = "bg-blue-50 text-blue-600";
    } else if (['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'json', 'php', 'py'].includes(ext || '')) {
        icon = <FileCode className="h-5 w-5 text-emerald-500" strokeWidth={2.5} />;
        colorClass = "bg-emerald-50 text-emerald-500";
    }

    return (
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass} shadow-sm transition-transform active:scale-95`}>
            {icon}
        </div>
    );
}
