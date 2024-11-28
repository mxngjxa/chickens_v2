import * as d3 from 'd3';

async function loadData() {
    try {
        const data = await d3.csv('./data/cleaned_v1.csv');
        return data.map((d) => {
            return {
                chicken_name: d.chicken_name,
                feather_color: d.feather_color,
                sex: d.sex,
                batch: +d.batch,
                start: new Date(d.start),
                end: new Date(d.end),
                picture: d.picture,
                death_cause: d.death_cause
            };
        });
    } catch (error) {
        console.error("Error loading CSV data:", error);
        return [];  // Return an empty array in case of error
    }
}

const data = await loadData();

const margin = () => ({
    top: 30,
    right: 30,
    bottom: 30,
    left: 30
});

const svgDim = (data) => ({
    width: data.length * 20,
    height: Math.max(...data.map(item => item.batch)) * 50
});

const createColorScale = (data, column) => {
    const uniqueValues = [...new Set(data.map((d) => d[column]))];
    return d3.scaleOrdinal(d3.schemeSet2).domain(uniqueValues)
};

const tooltip = () => {
    return (element) => {
        element
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("top", 0)
            .style("opacity", 0)
            .style("background", "white")
            .style("border-radius", "5px")
            .style("box-shadow", "0 0 10px rgba(0,0,0,.25)")
            .style("padding", "10px")
            .style("line-height", "1.3")
            .style("font", "11px sans-serif")
    };
};

const { width, height } = svgDim(data);
const { top, right, bottom, left } = margin();
const colorScale = createColorScale(data, 'batch');

// Create SVG with border
let svg = d3.select('svg')
    .attr('width', width)
    .attr('height', height)
    .style('border', '5px solid blue');

// Scale for x-axis
const xScale = d3.scaleBand()
    .domain(data.map(d => d.chicken_name))
    .range([0, width])
    .padding(0.1);

// Scale for y-axis (using batch)
const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.batch)])
    .range([height, 0]);


// Create bars
const createBars = (svg, data, xScale, yScale, height, colorScale) => {
    svg.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.chicken_name))
        .attr('y', d => yScale(d.batch))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(d.batch))
        .attr('fill', d => colorScale(d.batch));  // Use the provided colorScale
};

svg.selectAll('text')
    .data(data)
    .enter()
    .append('text')
    .text(d => d.chicken_name)
    .attr('x', d => xScale(d.chicken_name) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.batch) - 5)
    .attr('text-anchor', 'middle')

createBars(svg, data, xScale, yScale, height, colorScale);