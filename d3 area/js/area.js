     var retdata = [
         {
             key: "1",
             values: [
                 {
                     "id": 0,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 4
                 },
                 {
                     "id": 1,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 7
                 },
                 {
                     "id": 2,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 5
                 },
                 {
                     "id": 3,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 7
                 },
                 {
                     "id": 4,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 6
                 },
                 {
                     "id": 5,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 8
                 },
                 {
                     "id": 6,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 5
                 },
                 {
                     "id": 7,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 9
                 },
                 {
                     "id": 8,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 4
                 },
                 {
                     "id": 9,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 4
                 }
                    ]
                },
         {
             key: "2",
             values: [
                 {
                     "id": 0,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 4
                 },
                 {
                     "id": 1,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 7
                 },
                 {
                     "id": 2,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 5
                 },
                 {
                     "id": 3,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 7
                 },
                 {
                     "id": 4,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 6
                 },
                 {
                     "id": 5,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 8
                 },
                 {
                     "id": 6,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 5
                 },
                 {
                     "id": 7,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 9
                 },
                 {
                     "id": 8,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 4
                 },
                 {
                     "id": 9,
                     "low": -Math.random(),
                     "high": Math.random(),
                     "avg": 4
                 }
                    ]
                }
            ];

     var options = {
         axes: {
             xLabel: "Id", // X Label Text
             yLabel: "Count", // Y Label Text
             yAxisLabelPos: "outer", //'inner' will set the Y-axis label position in inner side, (e.g. inner or outer)
             //                    xScale : "datetime" //For date time in X-axis, provide 'datetime' (e.g. datetime, str)
         },
         lineOpt: {
             strokeWidth: 1,
             areaOpacity: 0.5,
             //                    interpolate : "cardinal" // Different shape of the line and area(i.e linear, cardinal, monotone etc.)
         },
         //                legend : {
         //                    enable : true,
         //                    legendType : 'circle' // Different shape of the legends(i.e. circle, rectangle)
         //                },
         background: {
             bgColor: "#FFF",
             gridlineWidth: 0.1,
             noofGrids: 10
         }
     };



     var chart = {};
     chart.tooltip = {};
     //    chart.chart = {};
     chart.render = {};
     chart.utility = {};




     function createAreaChart(retdata, options) {

         //    var chart = window.chart = {};
         //    chart.tooltip = chart.tooltip || {};
         //    //    chart.legend = chart.legend || {};
         //    //    chart.lineChart = chart.lineChart || {};
         //    chart.chart = chart.chart || {};
         //    chart.component = chart.component || {};
         //    chart.utility = chart.utility || {};

         //            var container = "errorchart";


         var data = retdata;

         data.forEach(function (kv) {
             var labelName = kv.key;
             kv.values.forEach(function (d) {
                 d.low = +d.low;
                 d.high = +d.high;
                 d.avg = +d.avg;
                 d.label = labelName;
             });
         });


         chart.render = function () {
             var margin = {
                 top: 50,
                 right: 40,
                 bottom: 60,
                 left: 50
             };

             var offsetHeight = document.getElementById("errorchart").offsetHeight,
                 offsetWidth = document.getElementById("errorchart").offsetWidth,
                 height = offsetHeight,
                 width = offsetWidth - 120,

                 defaultChartOpt = {
                     axes: {
                         xLabel: "id",
                         yLabel: "Count",
                         yAxisLabelPos: "outer", //inner will set the Y axis label position in inner side,
                         //                    xScale : "datetime1" //For date time in X axis, provide 'datetime'
                     },
                     lineOpt: {
                         strokeWidth: 2,
                         areaOpacity: 0.5,
                         interpolate: "cardinal" //Different shape of the line and area(i.e linear, cardinal, monotone etc)
                     },
                     //                    legend: {
                     //                        enable: false,
                     //                        legendType: 'circle'
                     //                    },
                     background: {
                         bgColor: "#FFF",
                         gridlineWidth: 0.2,
                         noofGrids: 10
                     }
                 },

                 chartOpt = chart.utility.extendDefaults(defaultChartOpt, options);

             console.log(chartOpt)

             //ASSIGNING LINE COLORS
             var linecolor = d3.scaleOrdinal(d3.schemeCategory10);
             //ASSIGNING AREA COLORS
             var areacolor = chart.utility.getColor(["#ffe4cc", "#c3efc3", "#f3bfbe"]); //["#ffe4cc", "#c3efc3"]

             //DEFINING X-AXIS RANGE
             var x = d3.scaleLinear([0, width]);

             //DEFINING Y-AXIS RANGE
             var y = d3.scaleLinear([height, 0]);

             //DEFINING X-AXIS SCALE
             var xAxis = d3.axisBottom(x)

             //DEFINING Y-AXIS SCALE
             var yAxis = d3.axisLeft(y)


             //DEFINING LINE
             //        var line = d3.svg.line()
             //                .interpolate(chartOpt.lineOpt.interpolate)
             //                .x(function (d) {
             //                    return x(d.date);
             //                })
             //                .y(function (d) {
             //                    return y(d.avg);
             //                });

             //DEFINING AREA
             var area = d3.area()
                 .curve(d3.curveCardinal)
                 .x(function (d) {
                     return x(d.id);
                 })
                 .y0(function (d) {
                     return y(d.low);
                 })
                 .y1(function (d) {
                     return y(d.high);
                 });

             //PREPARING SVG      
             var svg = d3.select("#errorchart").append("svg")
                 //            .attr("width", width + margin.left + margin.right)
                 //            .attr("height", height + margin.top + margin.bottom)
                 .attr('preserveAspectRatio', 'xMinYMin meet')
                 .attr(
                     'viewBox',
                     `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`
                 )
                 .append("g")
                 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

             var chartcontG = svg.append("g")
                 .attr("class", "chart-content-g");


             //CREATING BACKGROUND
             var chartbackground = chartcontG.append("g")
                 .attr("class", "chart-chart-background");
             chartbackground.append("svg:rect") // Grid lines Bakcground
                 .attr("x", 0)
                 .attr("y", 0)
                 .attr("height", height)
                 .attr("width", width)
                 .attr("fill", chartOpt.background.bgColor)
                 .style("opacity", "0.3");
             //->CREATING Y GRID IN BACKGROUND
             chartbackground.append("g") // Draw the y Grid lines
                 .attr("class", "grid")
                 .style("stroke-width", chartOpt.background.gridlineWidth)
             //            .call(make_x_axis()
             //                .tickSize(height, 0, 0)
             //                .tickFormat("")
             //            );



             function make_y_axis() { // function for the y grid lines
                 return d3.axisLeft(y)
                     .ticks(chartOpt.background.noofGrids)
             }

             function make_x_axis() { // function for the y grid lines
                 return d3.axisBottom(x)
                     .ticks(8)
             }

             var minLow = d3.min(data, function (kv) {
                 return d3.min(kv.values, function (d) {
                     return d.low;
                 });
             });
             var maxHigh = d3.max(data, function (kv) {
                 return d3.max(kv.values, function (d) {
                     return d.high;
                 });
             });

             //DEFINING X AND Y DOMAINS
             //            if (chartOpt.axes.xScale === 'datetime') {
             //                x.domain(d3.extent(data[0].values.map(function (d) {
             //                    return d.id;
             //                })));
             //            } else {
             //                x.domain(data[0].values.map(function (d) {
             //                    return d.id;
             //                })).rangePoints([0, width]);
             //            }
             x.domain(d3.extent(data[0].values.map(function (d) {
                 return d.id;
             })));

             y.domain([-1, 1]);

             //SET NO OF Y GRIDS
             noofgrids = maxHigh;


             //PLOT X-AXIS
             svg.append("g")
                 .attr("class", "x axis")
                 .call(xAxis)
                 .attr("transform", "translate(0," + height + ")")
                 .append("text")
                 .attr("x", 50 * 8) //POSITIONING X AXIS TEXT
                 .attr("dx", ".81em") //POSITIONING X AXIS TEXT
                 .attr("y", 30) //POSITIONING X AXIS TEXT
                 .attr("dy", ".71em") //POSITIONING X AXIS TEXT
                 .style("text-anchor", "end")
                 .text(chartOpt.axes.xLabel);

             //PLOT Y-AXIS
             svg.append("g")
                 .attr("class", "y axis")
                 .call(yAxis)
                 .append("text")
                 .attr("transform", "rotate(-90)")
                 .attr("y", function () {
                     if (chartOpt.axes.yAxisLabelPos == 'outer')
                         return (-6 * 7)
                     else
                         return 6;
                 })
                 .attr("dy", ".71em")
                 .style("text-anchor", "end")
                 .text(chartOpt.axes.yLabel);

             //DRAWING AREA GROUP
             var chartareagrp = chartcontG.append("g")
                 .attr("class", "chart-area-grp");
             var garea = chartareagrp.selectAll(".garea")
                 .data(data)
                 .enter().append("g")
                 .attr("class", "garea");

             //DRAWING AREA
             var parea = garea.append("path")
                 .data(data)
                 .attr("class", "chart-area")
                 .attr("id", function (d, i) {
                     return "chart-area-errorchart-" + i;
                 })
                 //.attr("d", area);
                 .attr("d", function (d, i) {
                     return area(d.values);
                 })
                 .style("fill", function (d, i) {
                     return areacolor(i);
                 })
                 .style("opacity", chartOpt.lineOpt.areaOpacity);


             //TOOLTIP STARTS HERE
             // Define 'div' for tooltips
             //        var tpCont = {};
             //        var div = d3.select('#' + container).append("div") // declare the properties for the div used for the tooltips
             //            .attr("class", "chart-tooltip") // apply the 'tooltip' class
             //            .attr("id", "tooltip-" + container) // apply the 'tooltip' id
             //            .style("opacity", 0);
             //
             //        var chartdotgrp = chartcontG.append("g")
             //            .attr("class", "chart-dot-grp");
             //        chartdotgrp.selectAll("g.dot")
             //            .data(data)
             //            .enter().append("g")
             //            .attr("class", "dot")
             //            .attr("id", function (d, i) {
             //                return "linedot-" + container + "-" + i;
             //            })
             //            .selectAll("circle")
             //            .data(function (d) {
             //                return d.values;
             //            })
             //            .enter().append("circle")
             //            .attr("r", 3)
             //            .style("fill", function (d) {
             //                return linecolor(d.label);
             //            })
             //            .style("opacity", 0)
             //            .style("stroke", function (d) {
             //                return linecolor(d.label);
             //            })
             //            .attr("cx", function (d, i) {
             //                return x(d.id);
             //            })
             //            .attr("cy", function (d, i) {
             //                return y(d.avg);
             //            })
             //
             //            .on("mouseover", function (d) { // when the mouse goes over a circle, do the following
             //                div.transition() // declare the transition properties to bring fade-in div
             //                    .duration(200) // it shall take 200ms
             //                    .style("opacity", .9); // and go all the way to an opacity of .9
             //
             //                tpCont.high = d.high, tpCont.avg = d.avg, tpCont.low = d.low;
             //
             //                var ttpHead = d.id; //If xscale                
             //
             //                var jtvtooltipDv = chart.tooltip.single(ttpHead, linecolor(d.label), d, tpCont, true);
             //                div.html(jtvtooltipDv) // add the text of the tooltip as html 
             //                    .style("left", function () {
             //                        return x(d.id) + 20 + "px";
             //                    }) // move it in the x direction 
             //                    .style("top", function () {
             //                        return y(d.avg) + 20 + "px";
             //                    }); // move it in the y direction
             //                document.getElementsByClassName("chart-tooltip")[0].style.border = "1px solid " + linecolor(d.label);
             //
             //            })
             //            .on("mouseout", function (d) { // when the mouse leaves a circle, do the following
             //                div.transition() // declare the transition properties to fade-out the div
             //                    .duration(500) // it shall take 500ms
             //                    .style("opacity", 0); // and go all the way to an opacity of nil
             //            });




             //        chart.component.update = function () {
             //            offsetHeight = document.getElementById(container).offsetHeight;
             //            offsetWidth = document.getElementById(container).offsetWidth;
             //            height = offsetHeight;
             //            width = offsetWidth - 120;
             //
             //            //DEFINING X-AXIS RANGE
             //            x = d3.scaleLinear([0, width]);
             //
             //            //DEFINING Y-AXIS RANGE
             //            y = d3.scaleLinear([height, 0]);
             //            
             //        }

             //        d3.select(window).on('resize', chart.component.update());
             //                        function resizeChart(){
             //                             chart.component.createChart(container, data, options)
             //                        }


         };


         
         

         //        chart.tooltip.single = function (heading, color, value, tpCont, tlptype) {
         //            var div = [];
         //            div.push('<div class="chart-iiner-tip">');
         //            div.push('<div class="tooltip-heading"><b>' + value.label + ' : ' + heading + '</b></div>');
         //            div.push('<div class="chart-tlp-wrapper">');
         //
         //            div.push('<table style="width:100%">');
         //            for (var i in tpCont) {
         //                div.push('<tr>');
         //                div.push('<td>');
         //                if (tlptype)
         //                    div.push('<div class="tpl-legend chart-tilp-legendicon" style="height:10px; width : 10px; background-color: ' + color + '; float: left; margin-top: 2px;"></div>');
         //                else
         //                    div.push('<div class="tpl-legend chart-tilp-legendicon" style="height:10px; width : 10px; background-color: ' + color + '; float: left; border-radius: 20px; margin-top: 2px;"></div>');
         //                div.push('<div class="tpl-legend chart-tilp-value" style="float: left; padding-left: 5px; text-transform: uppercase">' + i + '</div>');
         //                div.push('</td>');
         //                div.push('<td>');
         //                div.push('<div class="chart-tlp-float chart-tlp-right"> ' + tpCont[i] + '</div>');
         //                div.push('</td>');
         //                div.push('</tr>');
         //            }
         //            div.push('</table>');
         //
         //            div.push('</div>');
         //            div.push('</div>');
         //            return div.join('');
         //        };



         chart.utility.getColor = function (color) {
             //if you pass in nothing, get default colors back
             if (color === undefined) {
                 return chart.utility.defaultColor();

                 //if passed an array, turn it into a color scale
             } else if (chart.utility.isArray(color)) {
                 var color_scale = d3.scaleOrdinal(color)
                 return function (d, i) {
                     var key = i === undefined ? d : i;
                     return d.color || color_scale(key);
                 };

             } else {
                 return color;
             }
         };



         chart.utility.lineOptions = function (stroke, opacity, interpolate) {
             var lineOpt = {
                 strokeWidth: 1,
                 areaOpacity: 0.5,
                 interpolate: "cardinal"
             };
             return lineOpt.extend;
         };
         chart.utility.extendDefaults = function (source, properties) {
             var property;
             for (property in properties) {
                 if (properties.hasOwnProperty(property)) {
                     source[property] = properties[property];
                 }
             }
             return source;
         };
         chart.utility.defaultColor = function () {
             return chart.utility.getColor(d3.scale.category20().range());
         };
         chart.utility.isArray = Array.isArray;
     };


     createAreaChart(retdata, options);
