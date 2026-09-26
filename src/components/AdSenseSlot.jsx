import React from 'react';

export const AdSenseSlot = ({ slot = "auto", className = "" }) => {
  // Production-ready Google AdSense Slot Container
  // Maintains layout stability (prevents CLS), clearly distinguishes promotional space from functional controls
  return (
    <div className={`my-8 w-full max-w-4xl mx-auto ${className}`}>
      <div className="border border-dashed border-[#E5E7EB] bg-[#F7F8FC]/60 rounded-xl p-4 flex flex-col items-center justify-center min-h-[100px] text-center transition-colors">
        <span className="text-[11px] font-medium tracking-wider uppercase text-[#9CA3AF] mb-1">
          Advertisement Space
        </span>
        <p className="text-xs text-[#6B7280] max-w-md">
          OmniDrive is 100% free and client-side. Non-intrusive advertising helps support offline browser development.
        </p>
      </div>
    </div>
  );
};
export default AdSenseSlot;
