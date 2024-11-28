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
                end: d.end === 'present' ? new Date() : new Date(d.end),
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
console.log(data)


const sortData = (data, property) => {
    if (!data || !Array.isArray(data)) {
        console.error("Invalid data passed to sortData:", data);
        return [];
    }

    console.log("Sorting Data by:", property);
    switch (property) {
        case "time":
            return data.sort((a, b) => d3.ascending(a.start, b.start));
        case "batch":
            return data.sort((a, b) => d3.ascending(a.batch, b.batch));
        case "color":
            return data.sort((a, b) => d3.ascending(a.feather_color, b.feather_color));
        case "sex":
            return data.sort((a, b) => d3.ascending(a.sex, b.sex));
        default:
            return data.sort((a, b) => d3.ascending(a.chicken_name, b.chicken_name));
    }
};



const margin = () => ({
    top: 30,
    right: 30,
    bottom: 30,
    left: 30
});

const svgDim = (data) => ({
    height: data.length * 20,
    width: Math.max(...data.map(item => item.batch)) * 100
});

const createColorScale = (data, column) => {
    const uniqueValues = [...new Set(data.map((d) => d[column]))];
    return d3.scaleOrdinal(d3.schemeSet2).domain(uniqueValues)
};

/// Function to create the dropdown
const dropdown = (svg, data) => {
    // Data for the dropdown options
    const options = ["batch", "time"];
    
    // Create the dropdown container and append it to the DOM
    const dropdown = d3.select("#dropdown");

    // Create a select element
    const select = dropdown.append("select")
        .attr("id", "sorting-dropdown")
        .attr("name", "sorting-options")
        .attr("title", "Order by");

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

    select.on("change", function() {
        const selectedValue = d3.select(this).property("value");
        console.log("Selected sorting criteria:", selectedValue);
        
    
        if (!data || data.length === 0) {
            console.error("Data is not loaded or empty:", data);
            return;
        }
        console.log(data)
        const sortedData = sortData(data, selectedValue);
        console.log(sortedData)

        // Update the bars with the sorted data
        renderBars(svg, sortedData, xScale, yScale, selectedValue, false);
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

// Define the x scale as a time scale
const xScale = d3.scaleTime()
    .domain([d3.min(data, d => d.start), d3.max(data, d => d.end)])  // Set the domain from the min start to the max end time
    .range([0, width]);  // Set the range based on the width of the SVG


// Scale for y-axis (now corresponds to chicken_name)
const yScale = d3.scaleBand()
    .domain(data.map(d => d.chicken_name))
    .range([0, height])
    .padding(0.1);


    const renderBars = (svg, data, xScale, yScale, property = 'batch', isInitial = true) => {
        const colorScale = createColorScale(data, property);
        const tooltipElement = tooltip();
    
        // Select all bars and bind data
        const bars = svg.selectAll('rect').data(data);
    
        if (isInitial) {
            // Create bars initially
            bars.enter()
                .append('rect')
                .attr('x', d => xScale(d.start))  // Position the bar based on start time
                .attr('y', d => yScale(d.chicken_name))  // Position on the y-axis based on chicken name
                .attr('width', d => xScale(d.end) - xScale(d.start))  // Width determined by time difference (end - start)
                .attr('height', yScale.bandwidth())  // Height based on yScale bandwidth
                .attr('fill', d => colorScale(d[property]))  // Color based on the property
                .on('mouseover', function(event, d) {
                    tooltipElement.transition()
                        .duration(200)
                        .style("opacity", 1);  // Show the tooltip
    
                    tooltipElement.html(`Chicken Name: ${d.chicken_name}<br>Batch: ${d.batch}`)
                        .style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on('mousemove', function(event) {
                    tooltipElement.style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on('mouseout', function() {
                    tooltipElement.transition()
                        .duration(200)
                        .style("opacity", 0);  // Hide the tooltip
                });
        } else {
            // Update bars on subsequent calls
            bars.transition()  // Add a transition for smooth updates
                .attr('fill', d => colorScale(d[property]))  // Update fill based on new property
                .attr('y', d => yScale(d.chicken_name))  // Update y position based on the sorted data
                .attr('x', d => xScale(d.start))  // Update x position based on start time
                .attr('width', d => xScale(d.end) - xScale(d.start))  // Update width based on time difference (end - start)
                .attr('height', yScale.bandwidth());  // Ensure bars' height is updated based on the y-scale
        }
    };
    


    // Call the function to create the dropdown
dropdown(svg, data);
renderBars(svg, data, xScale, yScale, 'batch', true);
