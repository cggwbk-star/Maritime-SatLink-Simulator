import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Coordinates } from '../types';

interface WorldMapProps {
  shipPos: Coordinates;
  setShipPos: (pos: Coordinates) => void;
  satLng: number;
}

const WorldMap: React.FC<WorldMapProps> = ({ shipPos, setShipPos, satLng }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current?.parentElement) {
        setContainerWidth(svgRef.current.parentElement.clientWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = containerWidth;
    const height = width * 0.5; // 2:1 aspect ratio for Equirectangular
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const projection = d3.geoEquirectangular()
      .scale(width / (2 * Math.PI))
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Load simple GeoJSON logic - creating a grid and contours manually 
    // or fetching would be ideal, but for standalone we draw a graticule and simple shapes.
    // For this demo, we will use d3.geoGraticule to show the world grid.
    const graticule = d3.geoGraticule();

    // Draw Water
    svg.append("path")
      .datum({ type: "Sphere" })
      .attr("class", "sphere")
      .attr("d", path)
      .attr("fill", "#0f172a")
      .attr("stroke", "#334155");

    // Draw Graticule
    svg.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 0.5);

    // Draw Continents (Simplified approximations via geoJson would be better, 
    // but without external fetching, we rely on the graticule + interaction).
    // To make it look nice, let's just use the graticule as the "map" since it provides lat/lon context.

    // Draw Equator
    svg.append("line")
      .attr("x1", 0)
      .attr("y1", height / 2)
      .attr("x2", width)
      .attr("y2", height / 2)
      .attr("stroke", "#64748b")
      .attr("stroke-dasharray", "4,4");

    // Interactive Layer
    const clickLayer = svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent")
      .attr("cursor", "crosshair");

    clickLayer.on("click", (event) => {
      const coords = projection.invert?.(d3.pointer(event));
      if (coords) {
        setShipPos({ lng: coords[0], lat: coords[1] });
      }
    });

    // Draw Ship Position
    const shipXY = projection([shipPos.lng, shipPos.lat]);
    if (shipXY) {
      svg.append("circle")
        .attr("cx", shipXY[0])
        .attr("cy", shipXY[1])
        .attr("r", 6)
        .attr("fill", "#3b82f6") // Blue 500
        .attr("stroke", "white")
        .attr("stroke-width", 2);
        
      svg.append("text")
        .attr("x", shipXY[0])
        .attr("y", shipXY[1] - 10)
        .text("SHIP")
        .attr("text-anchor", "middle")
        .attr("fill", "#3b82f6")
        .attr("font-size", "10px")
        .attr("font-weight", "bold");
    }

    // Draw Satellite Position (Along Equator)
    const satXY = projection([satLng, 0]);
    if (satXY) {
       svg.append("circle")
        .attr("cx", satXY[0])
        .attr("cy", satXY[1])
        .attr("r", 6)
        .attr("fill", "#ef4444") // Red 500
        .attr("stroke", "white")
        .attr("stroke-width", 2);

       svg.append("text")
        .attr("x", satXY[0])
        .attr("y", satXY[1] + 15)
        .text("SAT")
        .attr("text-anchor", "middle")
        .attr("fill", "#ef4444")
        .attr("font-size", "10px")
        .attr("font-weight", "bold");
        
       // Draw Line of Sight (Curved) on Map
       if (shipXY) {
         const link = {type: "LineString", coordinates: [[shipPos.lng, shipPos.lat], [satLng, 0]]};
         svg.append("path")
            .datum(link)
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", "#fbbf24") // Amber
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "4,4")
            .attr("opacity", 0.6);
       }
    }

  }, [containerWidth, shipPos, satLng, setShipPos]);

  return (
    <div className="w-full bg-slate-800 rounded-lg overflow-hidden border border-slate-700 shadow-xl relative">
       <div className="absolute top-2 left-2 bg-slate-900/80 px-2 py-1 rounded text-xs text-slate-400 z-10 pointer-events-none">
         Click map to set ship position
       </div>
      <svg ref={svgRef} style={{ width: '100%', height: 'auto', display: 'block' }} viewBox={`0 0 ${containerWidth} ${containerWidth * 0.5}`} />
    </div>
  );
};

export default WorldMap;