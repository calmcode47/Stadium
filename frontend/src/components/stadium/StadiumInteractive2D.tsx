import React, { useState } from 'react'
import type { StandSection } from '@/types/operations'

interface StadiumInteractive2DProps {
  sections: StandSection[]
  selectedSectionId: string | null
  onSelectSection: (section: StandSection) => void
}

export const StadiumInteractive2D: React.FC<StadiumInteractive2DProps> = ({
  sections,
  selectedSectionId,
  onSelectSection
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Map sections by their ID for easy access
  const standMap = sections.reduce((acc, curr) => {
    acc[curr.id] = curr
    return acc
  }, {} as Record<string, StandSection>)

  const handleHover = (id: string | null) => {
    setHoveredId(id)
  }

  const renderSector = (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string
  ) => {
    const section = standMap[id]
    if (!section) return null

    const isSelected = selectedSectionId === id
    const isHovered = hoveredId === id
    const percent = Math.min(100, Math.round((section.occupancy / section.maxCapacity) * 100))

    return (
      <g
        key={id}
        className="cursor-pointer select-none"
        onClick={() => onSelectSection(section)}
        onMouseEnter={() => handleHover(id)}
        onMouseLeave={() => handleHover(null)}
      >
        {/* Main shape container */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          className={`transition-colors duration-200 stroke-cyan ${
            isSelected 
              ? 'fill-cyan/20 stroke-[2px] stroke-cyan' 
              : isHovered 
                ? 'fill-cyan/15 stroke-cyan/90 stroke-[1.5px]' 
                : 'fill-surface/40 stroke-cyan/30 stroke-[1px]'
          }`}
        />
        
        {/* Grid texture lines inside sector when hovered/selected */}
        {(isHovered || isSelected) && (
          <line 
            x1={x} 
            y1={y + height / 2} 
            x2={x + width} 
            y2={y + height / 2} 
            className="stroke-cyan/10 stroke-[1px]" 
            strokeDasharray="2 2"
          />
        )}

        {/* Text details */}
        <text
          x={x + width / 2}
          y={y + height / 2 + 4}
          className={`font-mono text-[9px] font-semibold text-center select-none ${
            isHovered || isSelected ? 'fill-cyan' : 'fill-text-muted'
          }`}
          textAnchor="middle"
        >
          {label}
        </text>

        {/* SVG Tooltip Overlay */}
        {isHovered && (
          <foreignObject
            x={x + width / 2 - 60}
            y={y - 42 > 0 ? y - 42 : y + height + 5}
            width="120"
            height="38"
            className="overflow-visible pointer-events-none z-50"
          >
            <div className="bg-surface border border-cyan text-cyan font-mono text-[8px] p-1 shadow-[0_0_10px_rgba(0,217,255,0.2)] flex flex-col gap-0.5 rounded-[2px] w-full text-left">
              <strong className="text-text-primary text-[9px] block truncate">{section.name}</strong>
              <div className="flex justify-between">
                <span>OCCUPANCY:</span>
                <span>{percent}%</span>
              </div>
              <div className="flex justify-between">
                <span>GATES:</span>
                <span>{section.gateStatus.toUpperCase()}</span>
              </div>
            </div>
          </foreignObject>
        )}
      </g>
    )
  }

  return (
    <div className="w-full h-full relative bg-surface/20 border border-cyan/15 rounded-[4px] p-6 flex items-center justify-center select-none overflow-hidden">
      
      {/* 2D Vector Canvas blueprint */}
      <svg
        viewBox="0 0 400 260"
        className="w-full max-w-lg text-cyan"
        fill="none"
        stroke="none"
      >
        {/* Background Grid Pattern in Blueprint */}
        <defs>
          <pattern id="blueGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0, 217, 255, 0.03)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#blueGrid)" />

        {/* Outer perimeter outline */}
        <rect 
          x="30" 
          y="20" 
          width="340" 
          height="220" 
          className="stroke-cyan/10 stroke-[1px]" 
          strokeDasharray="4 4"
        />

        {/* Center Pitch Field */}
        <g className="opacity-80">
          <rect
            x="115"
            y="75"
            width="170"
            height="110"
            className="fill-base/80 stroke-cyan/20 stroke-[1px]"
          />
          {/* Pitch Markings */}
          <circle cx="200" cy="130" r="25" className="stroke-cyan/10 stroke-[1px]" />
          <line x1="200" y1="75" x2="200" y2="185" className="stroke-cyan/10 stroke-[1px]" />
          <rect x="115" y="105" width="20" height="50" className="stroke-cyan/10 stroke-[1px]" />
          <rect x="265" y="105" width="20" height="50" className="stroke-cyan/10 stroke-[1px]" />
          <text
            x="200"
            y="134"
            className="fill-cyan/15 font-mono text-[10px] font-bold"
            textAnchor="middle"
          >
            PITCH CORE 01
          </text>
        </g>

        {/* Render Stadium Stands */}
        {renderSector('sect-north', 115, 30, 170, 35, 'NORTH STAND')}
        {renderSector('sect-south', 115, 195, 170, 35, 'SOUTH STAND')}
        {renderSector('sect-west', 70, 75, 35, 110, 'WEST STAND')}
        {renderSector('sect-east', 295, 75, 35, 110, 'EAST STAND')}

        {/* Stylized Floodlight Poles */}
        {[
          [60, 65],
          [340, 65],
          [60, 195],
          [340, 195]
        ].map((pt, idx) => (
          <g key={idx} className="opacity-50">
            <line 
              x1={pt[0]} 
              y1={pt[1]} 
              x2={pt[0] + (idx % 2 === 0 ? -10 : 10)} 
              y2={pt[1] + (idx < 2 ? -10 : 10)} 
              className="stroke-cyan/30 stroke-[1px]" 
            />
            <circle 
              cx={pt[0]} 
              cy={pt[1]} 
              r="2" 
              className="fill-cyan"
            />
          </g>
        ))}
      </svg>

      {/* Floating Blueprint Telemetry */}
      <div className="absolute bottom-2 left-2 pointer-events-none font-mono text-[9px] text-cyan/60 uppercase">
        2D VECTOR MAP // ENGINE: SVG LAYERS // SAFE MODE NOMINAL
      </div>
    </div>
  )
}

export default StadiumInteractive2D
