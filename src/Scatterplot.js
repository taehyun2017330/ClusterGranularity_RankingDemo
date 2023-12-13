import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Scatterplot = ({ id, data, onSelect, onUnsure }) => {
    const d3Container = useRef(null);
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = 460 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    const buttonStyles = {
        backgroundColor: '#4CAF50', // Feel free to change the color
        color: 'white',
        padding: '10px 20px',
        fontSize: '16px',
        borderRadius: '5px',
        cursor: 'pointer',
        border: 'none',
        marginTop: '20px',
    };

    useEffect(() => {
        if (data && d3Container.current) {
            const svg = d3.select(d3Container.current);

            // Clear SVG before re-render
            svg.selectAll("*").remove();

            // Create scales with padding
            const xExtent = d3.extent(data, d => d[0]);
            const xPadding = (xExtent[1] - xExtent[0]) * 0.1; // 10% padding
            const x = d3.scaleLinear()
                .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
                .range([0, width]);

            const yExtent = d3.extent(data, d => d[1]);
            const yPadding = (yExtent[1] - yExtent[0]) * 0.1; // 10% padding
            const y = d3.scaleLinear()
                .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
                .range([height, 0]);

            // Add dots
            const plot = svg.append('g').attr("transform", `translate(${margin.left},${margin.top})`);
            plot.selectAll("dot")
                .data(data)
                .enter()
                .append("circle")
                .attr("cx", d => x(d[0]))
                .attr("cy", d => y(d[1]))
                .attr("r", 3)
                .style("fill", "#000000");
        }
    }, [data]);

   
    return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: '10px' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}></div>
            <svg
                ref={d3Container}
                width={width + margin.left + margin.right}
                height={height + margin.top + margin.bottom}
                style={{ border: '1px solid black', alignSelf: 'center' }}
            >
                <g transform={`translate(${margin.left},${margin.top})`} />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button style={buttonStyles} onClick={onSelect}>Select This Scatterplot</button>
            </div>
        </div>
    );
};


export default Scatterplot;
