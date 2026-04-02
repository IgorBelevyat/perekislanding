import React from 'react';

// Common sizing base width=90, height=115
const CanisterIcon = ({ x, y }) => (
    <svg x={x} y={y} width="90" height="115" viewBox="0 0 100 130" overflow="visible">
        {/* Main Body with smaller border radius to match UI scale better */}
        <rect x="5" y="30" width="85" height="95" rx="8" fill="#fff" stroke="currentColor" strokeWidth="4" />
        {/* Cap section */}
        <path d="M 25 30 L 25 10 L 45 10 L 45 30" fill="#fff" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
        <rect x="22" y="8" width="26" height="8" rx="2" fill="#fff" stroke="currentColor" strokeWidth="4" />
        {/* Handle */}
        <path d="M 50 30 L 50 15 C 50 5, 80 5, 80 15 L 80 30" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
);

const StripsIcon = ({ x, y }) => (
    <svg x={x} y={y} width="40" height="95" viewBox="0 0 40 100" overflow="visible">
        {/* Body */}
        <path d="M 10 25 L 10 90 C 10 98, 30 98, 30 90 L 30 25" fill="#fff" stroke="currentColor" strokeWidth="4" />
        {/* Cap */}
        <rect x="6" y="10" width="28" height="15" rx="2" fill="#fff" stroke="currentColor" strokeWidth="4" />
    </svg>
);

const CupIcon = ({ x, y }) => (
    <svg x={x} y={y} width="55" height="90" viewBox="0 0 60 90" overflow="visible">
        {/* Body */}
        <path d="M 10 20 L 50 20 L 45 80 C 44 88, 16 88, 15 80 Z" fill="#fff" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
        {/* Handle */}
        <path d="M 47 30 L 55 30 C 58 30, 58 65, 55 65 L 43 65" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
);

function BundleSilhouettes({ type }) {
    let color = 'rgba(0, 150, 184, 0.25)';

    // Помаранчевий для "Оптимальний вибір"
    if (type === 'optimal') {
        color = 'rgba(255, 122, 0, 0.35)';
    }

    return (
        <div className="bundle-card__silhouettes" style={{ color }}>
            {/* ViewBox updated to match the ~1.6 aspect ratio of the 320x190 container */}
            <svg width="100%" height="100%" viewBox="0 0 220 130" preserveAspectRatio="xMaxYMax meet" overflow="visible">

                {/* 
                    Elements are drawn from right to left! 
                    This way the left canister is drawn LAST, placing it ON TOP of the right one.
                    This perfectly exposes the rightward-facing handles.
                */}

                {type === 'optimal' && (
                    <>
                        <CanisterIcon x="150" y="15" />
                        <CanisterIcon x="70" y="15" />
                    </>
                )}

                {type === 'minimal' && (
                    <>
                        <CanisterIcon x="150" y="15" />
                        <CanisterIcon x="110" y="15" />
                        <CanisterIcon x="70" y="15" />
                        <CanisterIcon x="30" y="15" />

                        {/* Strips next to the leftmost canister */}
                        <StripsIcon x="0" y="35" />
                    </>
                )}

                {type === 'maximum' && (
                    <>
                        <CanisterIcon x="150" y="15" />
                        <CanisterIcon x="125" y="15" />
                        <CanisterIcon x="100" y="15" />
                        <CanisterIcon x="75" y="15" />
                        <CanisterIcon x="50" y="15" />
                        <CanisterIcon x="25" y="15" />

                        {/* Lowered Cup to align base with Canisters (y: 35 -> 40) */}
                        <CupIcon x="-20" y="40" />
                        <StripsIcon x="-45" y="35" />
                    </>
                )}
            </svg>
        </div>
    );
}

export default BundleSilhouettes;
