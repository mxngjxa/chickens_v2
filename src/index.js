import * as d3 from 'd3';

const loadData = async () => {
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
    height: data.length * 20,
    width: Math.max(...data.map(item => item.batch)) * 50
});

const createColorScale = (data, column) => {
    const uniqueValues = [...new Set(data.map((d) => d[column]))];
    return d3.scaleOrdinal(d3.schemeSet2).domain(uniqueValues)
};

// Function to create the dropdown
const dropdown = () => {
    // Data for the dropdown options
    const options = ["batch", "time", "color", "sex"];
    
    // Create the dropdown container and append it to the DOM
    const dropdown = d3.select("#dropdown");

    // Create a select element
    const select = dropdown.append("select")
        .attr("id", "sorting-dropdown")
        .attr("name", "sorting-options")
        .attr("title", "Sort by");

    // Add a default title option
    select.append("option")
        .attr("value", "batch")
        .text("batch");

    // Append options to the dropdown
    select.selectAll("option")
        .data(options)
        .enter()
        .append("option")
        .attr("value", d => d)  // Set the value of each option
        .text(d => d);  // Set the text label of each option

    // Set default selected option (for example, "batch")
    select.property("value", "batch");

    // Listen for changes in selection and log the selected value
    select.on("change", function() {
        const selectedValue = d3.select(this).property("value");
        console.log("Selected sorting criteria:", selectedValue);
        updateBars(svg, data, selectedValue)
    });
};

const tooltip = () => {
    const tooltipElement = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("top", 0)
        .style("opacity", 0)
        .style("background", "white")
        .style("border-radius", "5px")
        .style("box-shadow", "0 0 10px rgba(0,0,0,.25)")
        .style("padding", "10px")
        .style("line-height", "1.3")
        .style("font", "11px sans-serif");

    return tooltipElement;
};
const { width, height } = svgDim(data);
const { top, right, bottom, left } = margin();

// Create SVG with border
let svg = d3.select('svg')
    .attr('width', width)
    .attr('height', height)
    .style('border', '1px solid blue')
    .style('margin-top', top + 'px')  // Apply top margin
    .style('margin-right', right + 'px')  // Apply right margin
    .style('margin-bottom', bottom + 'px')  // Apply bottom margin
    .style('margin-left', left + 'px');  // Apply left margin;

// Scale for x-axis (now corresponds to batch)
const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.batch)])
    .range([0, width]);

// Scale for y-axis (now corresponds to chicken_name)
const yScale = d3.scaleBand()
    .domain(data.map(d => d.chicken_name))
    .range([0, height])
    .padding(0.1);


// Create bars
const createBars = (svg, data, xScale, yScale) => {
    let colorScale = createColorScale(data, 'batch');
    const tooltipElement = tooltip();

    svg.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', d => yScale(d.chicken_name))
        .attr('width', d => xScale(d.batch))
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(d.batch))
        .on('mouseover', function(event, d) {
            tooltipElement.transition()
                .duration(200)
                .style("opacity", 1);  // Show the tooltip

            tooltipElement.html(`Chicken Name: ${d.chicken_name}<br>Batch: ${d.batch}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        // Mousemove event to move the tooltip
        .on('mousemove', function(event) {
            tooltipElement.style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        // Mouseout event to hide the tooltip
        .on('mouseout', function() {
            tooltipElement.transition()
                .duration(200)
                .style("opacity", 0);  // Hide the tooltip
        });  // Use dynamic properties
};

// Function to update the bars based on the dropdown selection
const updateBars = (svg, data, property) => {
    let colorScale = createColorScale(data, property);

    svg.selectAll('rect')
        .data(data)
        .transition()  // Optionally, you can add a transition for smooth updates
        .attr('fill', d => colorScale(d[property]));  // Update fill based on new property
};


    // Call the function to create the dropdown
dropdown();
createBars(svg, data, xScale, yScale, height, 'batch');