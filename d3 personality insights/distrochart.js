function makeDistroChart(settings) {

    var chart = {};

    // Defaults
    chart.settings = {
        data: null,
        xName: null,
        yName: null,
        selector: null,
        axisLables: null,
        yTicks: 1,
        scale: 'linear',
        chartSize: {
            width: 800,
            height: 400
        },
        margin: {
            top: 15,
            right: 60,
            bottom: 40,
            left: 50
        },
        constrainExtremes: false,
        color: d3.scaleOrdinal(d3.schemeCategory10)
    };
    for (var setting in settings) {
        chart.settings[setting] = settings[setting]
    }


    function formatAsFloat(d) {
        if (d % 1 !== 0) {
            return d3.format(".2f")(d);
        } else {
            return d3.format(".0f")(d);
        }
    }

    function logFormatNumber(d) {
        var x = Math.log(d) / Math.log(10) + 1e-6;
        return Math.abs(x - Math.floor(x)) < 0.6 ? formatAsFloat(d) : "";
    }

    //    chart.yFormatter = formatAsFloat;
    chart.xFormatter = formatAsFloat;

    chart.data = chart.settings.data;

    chart.groupObjs = {}; //The data organized by grouping and sorted as well as any metadata for the groups
    chart.objs = {
        mainDiv: null,
        chartDiv: null,
        g: null,
        xAxis: null,
        yAxis: null
    };
    chart.colorFunct = null;

    /**
     * Takes an array, function, or object mapping and created a color function from it
     * @param {function|[]|object} colorOptions
     * @returns {function} Function to be used to determine chart colors
     */
    function getColorFunct(colorOptions) {
        if (typeof colorOptions == 'function') {
            return colorOptions
        } else if (Array.isArray(colorOptions)) {
            //  If an array is provided, map it to the domain
            var colorMap = {},
                cColor = 0;
            for (var cName in chart.groupObjs) {
                colorMap[cName] = colorOptions[cColor];
                cColor = (cColor + 1) % colorOptions.length;
            }
            return function (group) {
                return colorMap[group];
            }
        } else if (typeof colorOptions == 'object') {
            // if an object is provided, assume it maps to  the colors
            return function (group) {
                return colorOptions[group];
            }
        } else {
            return d3.scaleOrdinal(d3.schemeCategory10);
        }
    }

    /**
     * Takes a percentage as returns the values that correspond to that percentage of the group range witdh
     * @param objWidth Percentage of range band
     * @param gName The bin name to use to get the x shift
     * @returns {{left: null, right: null, middle: null}}
     */
    //    function getObjWidth(objWidth, gName) {
    //        var objSize = {
    //            left: null,
    //            right: null,
    //            middle: null
    //        };
    //        var width = chart.xScale.bandwidth() * (objWidth / 100);
    //        var padding = (chart.xScale.bandwidth() - width) / 2;
    //        var gShift = chart.xScale(gName);
    //        objSize.middle = chart.xScale.bandwidth() / 2 + gShift;
    //        objSize.left = padding + gShift;
    //        objSize.right = objSize.left + width;
    //        return objSize;
    //    }
    function getObjHeight(objHeight, gName) {
        var objSize = {
            top: null,
            bottom: null,
            middle: null
        };
        var height = chart.yScale.bandwidth() * (objHeight / 100);
        var padding = (chart.yScale.bandwidth() - height) / 2;
        var gShift = chart.yScale(gName);
        objSize.middle = chart.yScale.bandwidth() / 2 + gShift;
        objSize.top = padding + gShift;
        objSize.bottom = objSize.top + height;
        return objSize;
    }


    /**
     * Adds jitter to the  scatter point plot
     * @param doJitter true or false, add jitter to the point
     * @param width percent of the range band to cover with the jitter
     * @returns {number}
     */
    function addJitter(doJitter, width) {
        if (doJitter !== true || width == 0) {
            return 0
        }
        return Math.floor(Math.random() * width) - width / 2;
    }

    function shallowCopy(oldObj) {
        var newObj = {};
        for (var i in oldObj) {
            if (oldObj.hasOwnProperty(i)) {
                newObj[i] = oldObj[i];
            }
        }
        return newObj;
    }

    /**
     * Closure that creates the tooltip hover function
     * @param groupName Name of the x group
     * @param metrics Object to use to get values for the group
     * @returns {Function} A function that provides the values for the tooltip
     */
    function tooltipHover(groupName, metrics) {
        var tooltipString = "Group: " + groupName;
        tooltipString += "<br\>Max: " + formatAsFloat(metrics.max, 0.1);
        tooltipString += "<br\>Q3: " + formatAsFloat(metrics.quartile3);
        tooltipString += "<br\>Median: " + formatAsFloat(metrics.median);
        tooltipString += "<br\>Q1: " + formatAsFloat(metrics.quartile1);
        tooltipString += "<br\>Min: " + formatAsFloat(metrics.min);
        tooltipString += "<br\>Repondents: " + formatAsFloat(metrics.length);
        return function () {
            chart.objs.tooltip.transition().duration(200).style("opacity", 1.0);
            chart.objs.tooltip.html(tooltipString)
        };
    }

    /**
     * Parse the data and calculates base values for the plots
     */
    ! function prepareData() {
        function calcMetrics(values) {

            var metrics = { //These are the original non�scaled values
                max: null,
                //                upperOuterFence: null,
                //                upperInnerFence: null,
                LeftOuterFence: null,
                LeftInnerFence: null,
                quartile3: null,
                median: null,
                mean: null,
                iqr: null,
                quartile1: null,
                //                lowerInnerFence: null,
                //                lowerOuterFence: null,
                rightInnerFence: null,
                rightOuterFence: null,
                min: null, 
                length: null
            };
            
            metrics.length = values.length;
            metrics.min = d3.min(values);
            metrics.quartile1 = d3.quantile(values, 0.25);
            metrics.median = d3.median(values);
            metrics.mean = d3.mean(values);
            metrics.quartile3 = d3.quantile(values, 0.75);
            metrics.max = d3.max(values);
            metrics.iqr = metrics.quartile3 - metrics.quartile1;

            //The inner fences are the closest value to the IQR without going past it (assumes sorted lists)
            var LIF = metrics.quartile1 - (1.5 * metrics.iqr);
            var UIF = metrics.quartile3 + (1.5 * metrics.iqr);
            for (var i = 0; i <= values.length; i++) {
                if (values[i] < LIF) {
                    continue;
                }
                //                if (!metrics.lowerInnerFence && values[i] >= LIF) {
                //                    metrics.lowerInnerFence = values[i];
                //                    continue;
                //                }
                //                if (values[i] > UIF) {
                //                    metrics.upperInnerFence = values[i - 1];
                //                    break;
                //                }
                if (!metrics.rightInnerFence && values[i] >= LIF) {
                    metrics.rightInnerFence = values[i];
                    continue;
                }
                if (values[i] > UIF) {
                    metrics.leftInnerFence = values[i - 1];
                    break;
                }
            }


            //            metrics.lowerOuterFence = metrics.quartile1 - (3 * metrics.iqr);
            //            metrics.upperOuterFence = metrics.quartile3 + (3 * metrics.iqr);
            //            if (!metrics.lowerInnerFence) {
            //                metrics.lowerInnerFence = metrics.min;
            //            }
            //            if (!metrics.upperInnerFence) {
            //                metrics.upperInnerFence = metrics.max;
            //            }
            metrics.rightOuterFence = metrics.quartile1 - (3 * metrics.iqr);
            metrics.leftOuterFence = metrics.quartile3 + (3 * metrics.iqr);
            if (!metrics.rightInnerFence) {
                metrics.rightInnerFence = metrics.min;
            }
            if (!metrics.leftInnerFence) {
                metrics.leftInnerFence = metrics.max;
            }

            return metrics
        }

        var current_x = null;
        var current_y = null;
        var current_row;

        // Group the values
        for (current_row = 0; current_row < chart.data.length; current_row++) {
            current_x = chart.data[current_row][chart.settings.xName];
            current_y = chart.data[current_row][chart.settings.yName];

            if (chart.groupObjs.hasOwnProperty(current_x)) {
                chart.groupObjs[current_x].values.push(current_y);
            } else {
                chart.groupObjs[current_x] = {};
                chart.groupObjs[current_x].values = [current_y];
            }
        }

        for (var cName in chart.groupObjs) {
            chart.groupObjs[cName].values.sort(d3.ascending);
            chart.groupObjs[cName].metrics = {};
            chart.groupObjs[cName].metrics = calcMetrics(chart.groupObjs[cName].values);

        }
    }();

    /**
     * Prepare the chart settings and chart div and svg
     */
    ! function prepareSettings() {
        //Set base settings
        chart.margin = chart.settings.margin;
        chart.divWidth = chart.settings.chartSize.width;
        chart.divHeight = chart.settings.chartSize.height;
        chart.width = chart.divWidth - chart.margin.left - chart.margin.right;
        chart.height = chart.divHeight - chart.margin.top - chart.margin.bottom;

        if (chart.settings.axisLabels) {
            chart.xAxisLable = chart.settings.axisLabels.xAxis;
            chart.yAxisLable = chart.settings.axisLabels.yAxis;
        } else {
            chart.xAxisLable = chart.settings.xName;
            chart.yAxisLable = chart.settings.yName;
        }

        if (chart.settings.scale === 'log') {
            //            chart.yScale = d3.scale.log();
            //            chart.yFormatter = logFormatNumber;
            chart.xScale = d3.scale.log();
            chart.xFormatter = logFormatNumber;
        } else {
            //            chart.yScale = d3.scaleLinear();
            chart.xScale = d3.scaleLinear();
        }

        if (chart.settings.constrainExtremes === true) {
            var fences = [];
            for (var cName in chart.groupObjs) {
                //                fences.push(chart.groupObjs[cName].metrics.lowerInnerFence);
                //                fences.push(chart.groupObjs[cName].metrics.upperInnerFence);
                fences.push(chart.groupObjs[cName].metrics.rightInnerFence);
                fences.push(chart.groupObjs[cName].metrics.leftInnerFence);
            }
            chart.range = d3.extent(fences);

        } else {
            chart.range = d3.extent(chart.data, function (d) {
                return d[chart.settings.yName];
            });
        }

        chart.colorFunct = getColorFunct(chart.settings.color);


        // Build Scale functions
        //        chart.yScale.range([chart.height, 0]).domain(chart.range).nice().clamp(true);
        //        chart.xScale = d3.scaleBand().domain(Object.keys(chart.groupObjs)).range([0, chart.width]);
        chart.yScale = d3.scaleBand().domain(Object.keys(chart.groupObjs)).range([chart.height, 0])
        chart.xScale.range([0, chart.width]).domain(chart.range).nice().clamp(true);

        //Build Axes Functions
        chart.objs.yAxis = d3.axisLeft(chart.yScale)
            //            .tickFormat(chart.yFormatter)
            .tickFormat(chart.xFormatter)
            .tickSizeOuter(0)
            .tickSizeInner(-chart.width + (chart.margin.right + chart.margin.left));
        chart.objs.xAxis = d3.axisBottom(chart.xScale).tickSize(5);

    }();

    /**
     * Updates the chart based on the current settings and window size
     * @returns {*}
     */
    chart.update = function () {
        // Update chart size based on view port size
        chart.width = parseInt(chart.objs.chartDiv.style("width"), 10) - (chart.margin.left + chart.margin.right);
        chart.height = parseInt(chart.objs.chartDiv.style("height"), 10) - (chart.margin.top + chart.margin.bottom);

        // Update scale functions
        //        chart.xScale.bandwidth([0, chart.width]);
        //        chart.yScale.range([chart.height, 0]);
        chart.xScale.range([0, chart.width]);
        chart.yScale.bandwidth([chart.height, 0]);


        // Update the yDomain if the Violin plot clamp is set to -1 meaning it will extend the violins to make nice points
        //        if (chart.violinPlots && chart.violinPlots.options.show == true && chart.violinPlots.options._yDomainVP != null) {
        if (chart.violinPlots && chart.violinPlots.options.show == true && chart.violinPlots.options._xDomainVP != null) {
            //            chart.yScale.domain(chart.violinPlots.options._yDomainVP).nice().clamp(true);
            chart.xScale.domain(chart.violinPlots.options._xDomainVP).nice().clamp(true);

        } else {
            //            chart.yScale.domain(chart.range).nice().clamp(true);
            chart.xScale.domain(chart.range).nice().clamp(true);
        }

        
        if (chart.densityPlots && chart.densityPlots.options.show == true && chart.densityPlots.options._xDomainVP != null) {
            //            chart.yScale.domain(chart.violinPlots.options._yDomainVP).nice().clamp(true);
            chart.xScale.domain(chart.densityPlots.options._xDomainVP).nice().clamp(true);

        } else {
            //            chart.yScale.domain(chart.range).nice().clamp(true);
            chart.xScale.domain(chart.range).nice().clamp(true);
        }

        //Update axes
        chart.objs.g.select('.x.axis').attr("transform", "translate(0," + chart.height + ")").call(chart.objs.xAxis)
            .selectAll("text")
            .attr("y", 5)
            .attr("x", -5)
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
        chart.objs.g.select('.x.axis .label').attr("x", chart.width / 2);
        chart.objs.g.select('.y.axis').call(chart.objs.yAxis.tickSizeInner(-chart.width));
        chart.objs.g.select('.y.axis .label').attr("x", -chart.height / 2);
        chart.objs.chartDiv.select('svg').attr("width", chart.width + (chart.margin.left + chart.margin.right)).attr("height", chart.height + (chart.margin.top + chart.margin.bottom));

        return chart;
    };

    /**
     * Prepare the chart html elements
     */
    ! function prepareChart() {
        // Build main div and chart div
        chart.objs.mainDiv = d3.select(chart.settings.selector)
            .style("max-width", chart.divWidth + "px");
        // Add all the divs to make it centered and responsive
        chart.objs.mainDiv.append("div")
            .attr("class", "inner-wrapper")
            .style("padding-bottom", (chart.divHeight / chart.divWidth) * 100 + "%")
            .append("div").attr("class", "outer-box")
            .append("div").attr("class", "inner-box");
        // Capture the inner div for the chart (where the chart actually is)
        chart.selector = chart.settings.selector + " .inner-box";
        chart.objs.chartDiv = d3.select(chart.selector);
        d3.select(window).on('resize.' + chart.selector, chart.update);

        // Create the svg
        chart.objs.g = chart.objs.chartDiv.append("svg")
            .attr("class", "chart-area")
            .attr("width", chart.width + (chart.margin.left + chart.margin.right))
            .attr("height", chart.height + (chart.margin.top + chart.margin.bottom))
            .append("g")
            .attr("transform", "translate(" + chart.margin.left + "," + chart.margin.top + ")");

        // Create axes
        chart.objs.axes = chart.objs.g.append("g").attr("class", "axis");
        //        chart.objs.axes.append("g")
        //            .attr("class", "x axis")
        //            .attr("transform", "translate(0," + chart.height + ")")
        //            .call(chart.objs.xAxis);

        chart.objs.axes.append("g")
            .attr("class", "y axis")
            .call(chart.objs.yAxis)
            .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", -42)
            .attr("x", -chart.height / 2)
            .attr("dy", ".71em")
            .style("text-anchor", "middle")
            .text(chart.yAxisLable);


        // x-axis label
        chart.objs.axes.append("text")
            .attr("class", "x-label")
            .attr("transform", "translate(0," + chart.height + ")")
            .attr("x", 20)
            .attr("y", 20)
            .text('low')
            .style("text-anchor", "middle");

        chart.objs.axes.append("text")
            .attr("class", "x-label")
            .attr("transform", "translate(0," + chart.height + ")")
            .attr("x", chart.width - 20)
            .attr("y", 20)
            .text('high')
            .style("text-anchor", "middle");

        chart.objs.axes.append("text")
            .attr("class", "x-label")
            .attr("transform", "translate(0," + chart.height + ")")
            .attr("x", chart.width / 2)
            .attr("y", 20)
            .text('average')
            .style("text-anchor", "middle");

        chart.objs.axes.append("line")
            .attr("class", "average")
            .attr("x1", chart.width / 2)
            .attr("y1", 0)
            .attr("x2", chart.width / 2)
            .attr("y2", chart.height)


        // Create tooltip div
        chart.objs.tooltip = chart.objs.mainDiv.append('div').attr('class', 'tooltip');
        for (var cName in chart.groupObjs) {
            chart.groupObjs[cName].g = chart.objs.g.append("g").attr("class", "group");
            chart.groupObjs[cName].g.on("mouseover", function () {
                chart.objs.tooltip
                    .style("display", null)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            }).on("mouseout", function () {
                chart.objs.tooltip.style("display", "none");
            }).on("mousemove", tooltipHover(cName, chart.groupObjs[cName].metrics))
        }
        chart.update();
    }();

    /**
     * Render a violin plot on the current chart
     * @param options
     * @param [options.showViolinPlot=true] True or False, show the violin plot
     * @param [options.resolution=100 default]
     * @param [options.bandwidth=10 default] May need higher bandwidth for larger data sets
     * @param [options.width=50] The max percent of the group rangeBand that the violin can be
     * @param [options.interpolation=''] How to render the violin
     * @param [options.clamp=0 default]
     *   0 = keep data within chart min and max, clamp once data = 0. May extend beyond data set min and max
     *   1 = clamp at min and max of data set. Possibly no tails
     *  -1 = extend chart axis to make room for data to interpolate to 0. May extend axis and data set min and max
     * @param [options.colors=chart default] The color mapping for the violin plot
     * @returns {*} The chart object
     */
    chart.renderViolinPlot = function (options) {
        chart.violinPlots = {};

        var defaultOptions = {
            show: true,
            showViolinPlot: true,
            resolution: 200,
            bandwidth: 20,
            //            width: 50,
            height: 50,
            interpolation: 'cardinal',
            clamp: 1,
            colors: chart.colorFunct,
            _xDomainVP: null, // If the Violin plot is set to close all violin plots, it may need to extend the domain, that extended domain is stored here

        };
        chart.violinPlots.options = shallowCopy(defaultOptions);
        for (var option in options) {
            chart.violinPlots.options[option] = options[option]
        }
        var vOpts = chart.violinPlots.options;

        // Create violin plot objects
        for (var cName in chart.groupObjs) {
            chart.groupObjs[cName].violin = {};
            chart.groupObjs[cName].violin.objs = {};
        }

        /**
         * Take a new set of options and redraw the violin
         * @param updateOptions
         */
        chart.violinPlots.change = function (updateOptions) {
            if (updateOptions) {
                for (var key in updateOptions) {
                    vOpts[key] = updateOptions[key]
                }
            }

            for (var cName in chart.groupObjs) {
                chart.groupObjs[cName].violin.objs.g.remove()
            }

            chart.violinPlots.prepareViolin();
            chart.violinPlots.update();
        };

        chart.violinPlots.reset = function () {
            chart.violinPlots.change(defaultOptions)
        };
        chart.violinPlots.show = function (opts) {
            if (opts !== undefined) {
                opts.show = true;
                if (opts.reset) {
                    chart.violinPlots.reset()
                }
            } else {
                opts = {
                    show: true
                };
            }
            chart.violinPlots.change(opts);

        };

        chart.violinPlots.hide = function (opts) {
            if (opts !== undefined) {
                opts.show = false;
                if (opts.reset) {
                    chart.violinPlots.reset()
                }
            } else {
                opts = {
                    show: false
                };
            }
            chart.violinPlots.change(opts);

        };

        /**
         * Update the violin obj values
         */
        chart.violinPlots.update = function () {
            var cName, cViolinPlot;

            for (cName in chart.groupObjs) {
                cViolinPlot = chart.groupObjs[cName].violin;

                // Build the violins sideways, so use the yScale for the xScale and make a new yScale
                //                var xVScale = chart.yScale.copy();
                var yVScale = chart.xScale.copy();


                // Create the Kernel Density Estimator Function
                //                cViolinPlot.kde = kernelDensityEstimator(eKernel(vOpts.bandwidth), xVScale.ticks(vOpts.resolution));
                //                cViolinPlot.kdedata = cViolinPlot.kde(chart.groupObjs[cName].values);
                cViolinPlot.kde = kernelDensityEstimator(eKernel(vOpts.bandwidth), yVScale.ticks(vOpts.resolution));
                cViolinPlot.kdedata = cViolinPlot.kde(chart.groupObjs[cName].values);

                var interpolateMax = chart.groupObjs[cName].metrics.max,
                    interpolateMin = chart.groupObjs[cName].metrics.min;

                if (vOpts.clamp == 0 || vOpts.clamp == -1) { //
                    // When clamp is 0, calculate the min and max that is needed to bring the violin plot to a point
                    // interpolateMax = the Minimum value greater than the max where y = 0
                    //                    interpolateMax = d3.min(cViolinPlot.kdedata.filter(function (d) {
                    //                        return (d.x > chart.groupObjs[cName].metrics.max && d.y == 0)
                    //                    }), function (d) {
                    //                        return d.x;
                    //                    });
                    interpolateMax = d3.min(cViolinPlot.kdedata.filter(function (d) {
                        return (d.y > chart.groupObjs[cName].metrics.max && d.x == 0)
                    }), function (d) {
                        return d.y;
                    });

                    // interpolateMin = the Maximum value less than the min where y = 0
                    //                    interpolateMin = d3.max(cViolinPlot.kdedata.filter(function (d) {
                    //                        return (d.x < chart.groupObjs[cName].metrics.min && d.y == 0)
                    //                    }), function (d) {
                    //                        return d.x;
                    //                    });
                    interpolateMin = d3.max(cViolinPlot.kdedata.filter(function (d) {
                        return (d.y < chart.groupObjs[cName].metrics.min && d.x == 0)
                    }), function (d) {
                        return d.y;
                    });

                    // If clamp is -1 we need to extend the axises so that the violins come to a point
                    if (vOpts.clamp == -1) {
                        kdeTester = eKernelTest(eKernel(vOpts.bandwidth), chart.groupObjs[cName].values);
                        if (!interpolateMax) {
                            //                            var interMaxY = kdeTester(chart.groupObjs[cName].metrics.max);
                            //                            var interMaxX = chart.groupObjs[cName].metrics.max;
                            var interMaxX = kdeTester(chart.groupObjs[cName].metrics.max);
                            var interMaxY = chart.groupObjs[cName].metrics.max;

                            var count = 25; // Arbitrary limit to make sure we don't get an infinite loop
                            //                            while (count > 0 && interMaxY != 0) {
                            //                                interMaxY = kdeTester(interMaxX);
                            //                                interMaxX += 1;
                            //                                count -= 1;
                            //                            }
                            //                            interpolateMax = interMaxX;
                            while (count > 0 && interMaxX != 0) {
                                interMaxX = kdeTester(interMaxY);
                                interMaxY += 1;
                                count -= 1;
                            }
                            interpolateMax = interMaxY;
                        }
                        if (!interpolateMin) {
                            //                            var interMinY = kdeTester(chart.groupObjs[cName].metrics.min);
                            //                            var interMinX = chart.groupObjs[cName].metrics.min;
                            //                            var count = 25; // Arbitrary limit to make sure we don't get an infinite loop
                            //                            while (count > 0 && interMinY != 0) {
                            //                                interMinY = kdeTester(interMinX);
                            //                                interMinX -= 1;
                            //                                count -= 1;
                            //                            }
                            //                            interpolateMin = interMinX;
                            var interMinX = kdeTester(chart.groupObjs[cName].metrics.min);
                            var interMinY = chart.groupObjs[cName].metrics.min;
                            var count = 25; // Arbitrary limit to make sure we don't get an infinite loop
                            while (count > 0 && interMinX != 0) {
                                interMinX = kdeTester(interMinY);
                                interMinY -= 1;
                                count -= 1;
                            }
                            interpolateMin = interMinY;
                        }

                    }
                    // Check to see if the new values are outside the existing chart range
                    //   If they are assign them to the master _yDomainVP
                    //                    if (!vOpts._yDomainVP) vOpts._yDomainVP = chart.range.slice(0);
                    //                    if (interpolateMin && interpolateMin < vOpts._yDomainVP[0]) {
                    //                        vOpts._yDomainVP[0] = interpolateMin;
                    //                    }
                    //                    if (interpolateMax && interpolateMax > vOpts._yDomainVP[1]) {
                    //                        vOpts._yDomainVP[1] = interpolateMax;
                    //                    }
                    if (!vOpts._xDomainVP) vOpts._xDomainVP = chart.range.slice(0);
                    if (interpolateMin && interpolateMin < vOpts._xDomainVP[0]) {
                        vOpts._xDomainVP[0] = interpolateMin;
                    }
                    if (interpolateMax && interpolateMax > vOpts._xDomainVP[1]) {
                        vOpts._xDomainVP[1] = interpolateMax;
                    }


                }


                if (vOpts.showViolinPlot) {
                    chart.update();
                    //                    xVScale = chart.yScale.copy();
                    yVScale = chart.xScale.copy();

                    // Need to recalculate the KDE because the xVScale changed
                    //                    cViolinPlot.kde = kernelDensityEstimator(eKernel(vOpts.bandwidth), xVScale.ticks(vOpts.resolution));
                    cViolinPlot.kde = kernelDensityEstimator(eKernel(vOpts.bandwidth), yVScale.ticks(vOpts.resolution));

                    cViolinPlot.kdedata = cViolinPlot.kde(chart.groupObjs[cName].values);
                }

                cViolinPlot.kdedata = cViolinPlot.kdedata
                    .filter(function (d) {
                        //                        return (!interpolateMin || d.x >= interpolateMin)
                        return (!interpolateMin || d.y >= interpolateMin)

                    })
                    .filter(function (d) {
                        //                        return (!interpolateMax || d.x <= interpolateMax)
                        return (!interpolateMax || d.y <= interpolateMax)

                    });
            }
            for (cName in chart.groupObjs) {
                cViolinPlot = chart.groupObjs[cName].violin;

                // Get the violin width
                //                var objBounds = getObjWidth(vOpts.width, cName);
                //                var width = (objBounds.right - objBounds.left) / 2;
                var objBounds = getObjHeight(vOpts.height, cName);
                var height = (objBounds.bottom - objBounds.top) / 2;


                //                var yVScale = d3.scaleLinear()
                //                    .range([width, 0])
                //                    .domain([0, d3.max(cViolinPlot.kdedata, function (d) {
                //                        return d.y;
                //                    })])
                //                    .clamp(true);
                var xVScale = d3.scaleLinear()
                    .range([height, 0])
                    .domain([0, d3.max(cViolinPlot.kdedata, function (d) {
                        return d.x;
                    })])
                    .clamp(true);


                //                var area = d3.area()
                //                    .curve(vOpts.interpolation)
                //                    .x(function (d) {
                //                        return xVScale(d.x);
                //                    })
                //                    .y0(width)
                //                    .y1(function (d) {
                //                        return yVScale(d.y);
                //                    });
                var area = d3.area()
                    .x(function (d) {
                        return yVScale(d.y);
                    })
                    .y0(height)
                    .y1(function (d) {
                        return xVScale(d.x);
                    });


                var line = d3.line()
                    .y(function (d) {
                        return xVScale(d.x);
                    })
                    .x(function (d) {
                        return yVScale(d.y)
                    });


                //                if (cViolinPlot.objs.left.area) {
                //                    cViolinPlot.objs.left.area
                //                        .datum(cViolinPlot.kdedata)
                //                        .attr("d", area);
                //                    cViolinPlot.objs.left.line
                //                        .datum(cViolinPlot.kdedata)
                //                        .attr("d", line);
                //
                //                    cViolinPlot.objs.right.area
                //                        .datum(cViolinPlot.kdedata)
                //                        .attr("d", area);
                //                    cViolinPlot.objs.right.line
                //                        .datum(cViolinPlot.kdedata)
                //                        .attr("d", line);
                //                }
                if (cViolinPlot.objs.top.area) {
                    cViolinPlot.objs.top.area
                        .datum(cViolinPlot.kdedata)
                        .attr("d", area);
                    cViolinPlot.objs.top.line
                        .datum(cViolinPlot.kdedata)
                        .attr("d", line);

                    cViolinPlot.objs.bottom.area
                        .datum(cViolinPlot.kdedata)
                        .attr("d", area);
                    cViolinPlot.objs.bottom.line
                        .datum(cViolinPlot.kdedata)
                        .attr("d", line);
                }


                // Rotate the violins
                //                cViolinPlot.objs.left.g.attr("transform", "rotate(90,0,0)   translate(0,-" + objBounds.left + ")  scale(1,-1)");
                //                cViolinPlot.objs.right.g.attr("transform", "rotate(90,0,0)  translate(0,-" + objBounds.right + ")");
                cViolinPlot.objs.top.g.attr("transform", "rotate(180,0,0)   translate(0,-" + objBounds.top + ") scale(-1,-1)");
                cViolinPlot.objs.bottom.g.attr("transform", "rotate(180,0,0)  translate(0,-" + objBounds.bottom + ") scale(-1,1)");

            }
        };

        /**
         * Create the svg elements for the violin plot
         */
        chart.violinPlots.prepareViolin = function () {
            var cName, cViolinPlot;

            if (vOpts.colors) {
                chart.violinPlots.color = getColorFunct(vOpts.colors);
            } else {
                chart.violinPlots.color = chart.colorFunct
            }

            if (vOpts.show == false) {
                return
            }

            for (cName in chart.groupObjs) {
                cViolinPlot = chart.groupObjs[cName].violin;

                cViolinPlot.objs.g = chart.groupObjs[cName].g.append("g").attr("class", "violin-plot");
                //                cViolinPlot.objs.left = {
                //                    area: null,
                //                    line: null,
                //                    g: null
                //                };
                //                cViolinPlot.objs.right = {
                //                    area: null,
                //                    line: null,
                //                    g: null
                //                };
                cViolinPlot.objs.top = {
                    area: null,
                    line: null,
                    g: null
                };
                cViolinPlot.objs.bottom = {
                    area: null,
                    line: null,
                    g: null
                };


                //                cViolinPlot.objs.left.g = cViolinPlot.objs.g.append("g");
                //                cViolinPlot.objs.right.g = cViolinPlot.objs.g.append("g");
                cViolinPlot.objs.top.g = cViolinPlot.objs.g.append("g");
                cViolinPlot.objs.bottom.g = cViolinPlot.objs.g.append("g");


                if (vOpts.showViolinPlot !== false) {
                    //Area
                    //                    cViolinPlot.objs.left.area = cViolinPlot.objs.left.g.append("path")
                    cViolinPlot.objs.top.area = cViolinPlot.objs.top.g.append("path")
                        .attr("class", "area")
                        .style("fill", chart.violinPlots.color(cName));
                    //                    cViolinPlot.objs.right.area = cViolinPlot.objs.right.g.append("path")
                    cViolinPlot.objs.bottom.area = cViolinPlot.objs.bottom.g.append("path")
                        .attr("class", "area")
                        .style("fill", chart.violinPlots.color(cName));

                    //Lines
                    //                    cViolinPlot.objs.left.line = cViolinPlot.objs.left.g.append("path")
                    cViolinPlot.objs.top.line = cViolinPlot.objs.top.g.append("path")
                        .attr("class", "line")
                        .attr("fill", 'none')
                        .style("stroke", chart.violinPlots.color(cName));
                    //                    cViolinPlot.objs.right.line = cViolinPlot.objs.right.g.append("path")
                    cViolinPlot.objs.bottom.line = cViolinPlot.objs.bottom.g.append("path")
                        .attr("class", "line")
                        .attr("fill", 'none')
                        .style("stroke", chart.violinPlots.color(cName));
                }

            }

        };


        //        function kernelDensityEstimator(kernel, x) {
        //            return function (sample) {
        //                return x.map(function (x) {
        //                    return {
        //                        x: x,
        //                        y: d3.mean(sample, function (v) {
        //                            return kernel(x - v);
        //                        })
        //                    };
        //                });
        //            };
        //        }
        function kernelDensityEstimator(kernel, y) {
            return function (sample) {
                return y.map(function (y) {
                    return {
                        y: y,
                        x: d3.mean(sample, function (v) {
                            return kernel(y - v);
                        })
                    };
                });
            };
        }


        function eKernel(scale) {
            return function (u) {
                return Math.abs(u /= scale) <= 1 ? .75 * (1 - u * u) / scale : 0;
            };
        }

        // Used to find the roots for adjusting violin axis
        // Given an array, find the value for a single point, even if it is not in the domain
        function eKernelTest(kernel, array) {
            return function (testX) {
                return d3.mean(array, function (v) {
                    return kernel(testX - v);
                })
            }
        }

        chart.violinPlots.prepareViolin();

        d3.select(window).on('resize.' + chart.selector + '.violinPlot', chart.violinPlots.update);
        chart.violinPlots.update();
        return chart;
    };

    /**
     * Render a box plot on the current chart
     * @param options
     * @param [options.show=true] Toggle the whole plot on and off
     * @param [options.showBox=true] Show the box part of the box plot
     * @param [options.showWhiskers=true] Show the whiskers
     * @param [options.showMedian=true] Show the median line
     * @param [options.showMean=false] Show the mean line
     * @param [options.medianCSize=3] The size of the circle on the median
     * @param [options.showOutliers=true] Plot outliers
     * @param [options.boxwidth=30] The max percent of the group rangeBand that the box can be
     * @param [options.lineWidth=boxWidth] The max percent of the group rangeBand that the line can be
     * @param [options.outlierScatter=false] Spread out the outliers so they don't all overlap (in development)
     * @param [options.outlierCSize=2] Size of the outliers
     * @param [options.colors=chart default] The color mapping for the box plot
     * @returns {*} The chart object
     */
    chart.renderBoxPlot = function (options) {
        chart.boxPlots = {};

        // Defaults
        var defaultOptions = {
            show: true,
            showBox: true,
            showWhiskers: true,
            showMedian: true,
            showMean: false,
            medianCSize: 0,
            showOutliers: true,
            boxWidth: 30,
            boxHeight: 30,
            lineWidth: null,
            lineHeight: null,
            scatterOutliers: false,
            outlierCSize: 2.5,
            colors: chart.colorFunct
        };
        chart.boxPlots.options = shallowCopy(defaultOptions);
        for (var option in options) {
            chart.boxPlots.options[option] = options[option]
        }
        var bOpts = chart.boxPlots.options;

        //Create box plot objects
        for (var cName in chart.groupObjs) {
            chart.groupObjs[cName].boxPlot = {};
            chart.groupObjs[cName].boxPlot.objs = {};
        }


        /**
         * Calculates all the outlier points for each group
         */
        ! function calcAllOutliers() {

            /**
             * Create lists of the outliers for each content group
             * @param cGroup The object to modify
             * @return null Modifies the object in place
             */
            function calcOutliers(cGroup) {
                var cExtremes = [];
                var cOutliers = [];
                var cOut, idx;
                for (idx = 0; idx <= cGroup.values.length; idx++) {
                    cOut = {
                        value: cGroup.values[idx]
                    };

                    //                    if (cOut.value < cGroup.metrics.lowerInnerFence) {
                    //                        if (cOut.value < cGroup.metrics.lowerOuterFence) {
                    //                            cExtremes.push(cOut);
                    //                        } else {
                    //                            cOutliers.push(cOut);
                    //                        }
                    //                    } else if (cOut.value > cGroup.metrics.upperInnerFence) {
                    //                        if (cOut.value > cGroup.metrics.upperOuterFence) {
                    //                            cExtremes.push(cOut);
                    //                        } else {
                    //                            cOutliers.push(cOut);
                    //                        }
                    //                    }
                    if (cOut.value < cGroup.metrics.rightInnerFence) {
                        if (cOut.value < cGroup.metrics.rightOuterFence) {
                            cExtremes.push(cOut);
                        } else {
                            cOutliers.push(cOut);
                        }
                    } else if (cOut.value > cGroup.metrics.leftInnerFence) {
                        if (cOut.value > cGroup.metrics.leftOuterFence) {
                            cExtremes.push(cOut);
                        } else {
                            cOutliers.push(cOut);
                        }
                    }
                }
                cGroup.boxPlot.objs.outliers = cOutliers;
                cGroup.boxPlot.objs.extremes = cExtremes;
            }

            for (var cName in chart.groupObjs) {
                calcOutliers(chart.groupObjs[cName]);
            }
        }();

        /**
         * Take updated options and redraw the box plot
         * @param updateOptions
         */
        chart.boxPlots.change = function (updateOptions) {
            if (updateOptions) {
                for (var key in updateOptions) {
                    bOpts[key] = updateOptions[key]
                }
            }

            for (var cName in chart.groupObjs) {
                chart.groupObjs[cName].boxPlot.objs.g.remove()
            }
            chart.boxPlots.prepareBoxPlot();
            chart.boxPlots.update()
        };

        chart.boxPlots.reset = function () {
            chart.boxPlots.change(defaultOptions)
        };
        chart.boxPlots.show = function (opts) {
            if (opts !== undefined) {
                opts.show = true;
                if (opts.reset) {
                    chart.boxPlots.reset()
                }
            } else {
                opts = {
                    show: true
                };
            }
            chart.boxPlots.change(opts)

        };
        chart.boxPlots.hide = function (opts) {
            if (opts !== undefined) {
                opts.show = false;
                if (opts.reset) {
                    chart.boxPlots.reset()
                }
            } else {
                opts = {
                    show: false
                };
            }
            chart.boxPlots.change(opts)
        };

        /**
         * Update the box plot obj values
         */
        chart.boxPlots.update = function () {
            var cName, cBoxPlot;

            for (cName in chart.groupObjs) {
                cBoxPlot = chart.groupObjs[cName].boxPlot;

                // Get the box width
                //                var objBounds = getObjWidth(bOpts.boxWidth, cName);
                //                var width = (objBounds.right - objBounds.left);
                var objBounds = getObjHeight(bOpts.boxHeight, cName);
                var height = objBounds.bottom - objBounds.top;

                var sMetrics = {}; //temp var for scaled (plottable) metric values
                for (var attr in chart.groupObjs[cName].metrics) {
                    sMetrics[attr] = null;
                    //                    sMetrics[attr] = chart.yScale(chart.groupObjs[cName].metrics[attr]);
                    sMetrics[attr] = chart.xScale(chart.groupObjs[cName].metrics[attr]);

                }

                // Box
                if (cBoxPlot.objs.box) {
                    cBoxPlot.objs.box
                        //                        .attr("x", objBounds.left)
                        .attr("y", objBounds.top)
                        //                        .attr('width', width)
                        .attr('width', -1 * (-sMetrics.quartile3 + sMetrics.quartile1))
                        //                        .attr("y", sMetrics.quartile3)
                        //                        .attr("rx", 1)
                        //                        .attr("ry", 1)
                        .attr("x", sMetrics.quartile1)
                        .attr("rx", 1)
                        .attr("ry", 1)
                        //                        .attr("height", -sMetrics.quartile3 + sMetrics.quartile1)
                        .attr("height", height)

                }

                // Lines
                var lineBounds = null;
                //                if (bOpts.lineWidth) {
                //                    lineBounds = getObjWidth(bOpts.lineWidth, cName)
                //                } else {
                //                    lineBounds = objBounds
                //                }
                if (bOpts.lineHeight) {
                    lineBounds = getObjHeight(bOpts.lineHeight, cName)
                } else {
                    lineBounds = objBounds
                }

                // --Whiskers
                if (cBoxPlot.objs.upperWhisker) {
                    cBoxPlot.objs.upperWhisker.fence
                        //                        .attr("x1", lineBounds.left)
                        //                        .attr("x2", lineBounds.right)
                        //                        .attr('y1', sMetrics.upperInnerFence)
                        //                        .attr("y2", sMetrics.upperInnerFence);
                        .attr("y1", lineBounds.top)
                        .attr("y2", lineBounds.bottom)
                        .attr('x1', sMetrics.leftInnerFence)
                        .attr("x2", sMetrics.leftInnerFence);

                    cBoxPlot.objs.upperWhisker.line
                        //                        .attr("x1", lineBounds.middle)
                        //                        .attr("x2", lineBounds.middle)
                        //                        .attr('y1', sMetrics.quartile3)
                        //                        .attr("y2", sMetrics.upperInnerFence);
                        .attr("y1", lineBounds.middle)
                        .attr("y2", lineBounds.middle)
                        .attr('x1', sMetrics.quartile3)
                        .attr("x2", sMetrics.leftInnerFence);


                    cBoxPlot.objs.lowerWhisker.fence
                        //                        .attr("x1", lineBounds.left)
                        //                        .attr("x2", lineBounds.right)
                        //                        .attr('y1', sMetrics.lowerInnerFence)
                        //                        .attr("y2", sMetrics.lowerInnerFence);
                        .attr("y1", lineBounds.top)
                        .attr("y2", lineBounds.bottom)
                        .attr('x1', sMetrics.rightInnerFence)
                        .attr("x2", sMetrics.rightInnerFence);

                    cBoxPlot.objs.lowerWhisker.line
                        //                        .attr("x1", lineBounds.middle)
                        //                        .attr("x2", lineBounds.middle)
                        //                        .attr('y1', sMetrics.quartile1)
                        //                        .attr("y2", sMetrics.lowerInnerFence);
                        .attr("y1", lineBounds.middle)
                        .attr("y2", lineBounds.middle)
                        .attr('x1', sMetrics.quartile1)
                        .attr("x2", sMetrics.rightInnerFence);
                }

                // --Median
                if (cBoxPlot.objs.median) {
                    cBoxPlot.objs.median.line
                        //                        .attr("x1", lineBounds.left)
                        //                        .attr("x2", lineBounds.right)
                        //                        .attr('y1', sMetrics.median)
                        //                        .attr("y2", sMetrics.median);
                        .attr("y1", lineBounds.top)
                        .attr("y2", lineBounds.bottom)
                        .attr('x1', sMetrics.median)
                        .attr("x2", sMetrics.median);

                    cBoxPlot.objs.median.circle
                        //                        .attr("cx", lineBounds.middle)
                        //                        .attr("cy", sMetrics.median)
                        .attr("cy", lineBounds.middle)
                        .attr("cx", sMetrics.median)
                }

                // --Mean
                if (cBoxPlot.objs.mean) {
                    cBoxPlot.objs.mean.line
                        //                        .attr("x1", lineBounds.left)
                        //                        .attr("x2", lineBounds.right)
                        //                        .attr('y1', sMetrics.mean)
                        //                        .attr("y2", sMetrics.mean);
                        .attr("y1", lineBounds.top)
                        .attr("y2", lineBounds.bottom, )
                        .attr('x1', sMetrics.mean)
                        .attr("x2", sMetrics.mean);

                    cBoxPlot.objs.mean.circle
                        //                        .attr("cx", lineBounds.middle)
                        //                        .attr("cy", sMetrics.mean);
                        .attr("cy", lineBounds.middle)
                        .attr("cx", sMetrics.mean);

                }

                // Outliers

                var pt;
                if (cBoxPlot.objs.outliers) {
                    for (pt in cBoxPlot.objs.outliers) {
                        cBoxPlot.objs.outliers[pt].point
                            //                            .attr("cx", objBounds.middle + addJitter(bOpts.scatterOutliers, width))
                            //                            .attr("cy", chart.yScale(cBoxPlot.objs.outliers[pt].value));
                            .attr("cy", objBounds.middle + addJitter(bOpts.scatterOutliers, height))
                            .attr("cx", chart.xScale(cBoxPlot.objs.outliers[pt].value));

                    }
                }
                if (cBoxPlot.objs.extremes) {
                    for (pt in cBoxPlot.objs.extremes) {
                        cBoxPlot.objs.extremes[pt].point
                            //                            .attr("cx", objBounds.middle + addJitter(bOpts.scatterOutliers, width))
                            //                            .attr("cy", chart.yScale(cBoxPlot.objs.extremes[pt].value));
                            .attr("cy", objBounds.middle + addJitter(bOpts.scatterOutliers, height))
                            .attr("cx", chart.xScale(cBoxPlot.objs.extremes[pt].value));

                    }
                }
            }
        };

        /**
         * Create the svg elements for the box plot
         */
        chart.boxPlots.prepareBoxPlot = function () {
            var cName, cBoxPlot;

            if (bOpts.colors) {
                chart.boxPlots.colorFunct = getColorFunct(bOpts.colors);
            } else {
                chart.boxPlots.colorFunct = chart.colorFunct
            }

            if (bOpts.show == false) {
                return
            }

            for (cName in chart.groupObjs) {
                cBoxPlot = chart.groupObjs[cName].boxPlot;

                cBoxPlot.objs.g = chart.groupObjs[cName].g.append("g").attr("class", "box-plot");

                //Plot Box (default show)
                if (bOpts.showBox) {
                    cBoxPlot.objs.box = cBoxPlot.objs.g.append("rect")
                        .attr("class", "box")
                        .style("fill", chart.boxPlots.colorFunct(cName))
                        .style("stroke", chart.boxPlots.colorFunct(cName));
                    //A stroke is added to the box with the group color, it is
                    // hidden by default and can be shown through css with stroke-width
                }

                //Plot Median (default show)
                if (bOpts.showMedian) {
                    cBoxPlot.objs.median = {
                        line: null,
                        circle: null
                    };
                    cBoxPlot.objs.median.line = cBoxPlot.objs.g.append("line")
                        .attr("class", "median");
                    cBoxPlot.objs.median.circle = cBoxPlot.objs.g.append("circle")
                        .attr("class", "median")
                        .attr('r', bOpts.medianCSize)
                        .style("fill", chart.boxPlots.colorFunct(cName));
                }

                // Plot Mean (default no plot)
                if (bOpts.showMean) {
                    cBoxPlot.objs.mean = {
                        line: null,
                        circle: null
                    };
                    cBoxPlot.objs.mean.line = cBoxPlot.objs.g.append("line")
                        .attr("class", "mean");
                    cBoxPlot.objs.mean.circle = cBoxPlot.objs.g.append("circle")
                        .attr("class", "mean")
                        .attr('r', bOpts.medianCSize)
                        .style("fill", chart.boxPlots.colorFunct(cName));
                }

                // Plot Whiskers (default show)
                if (bOpts.showWhiskers) {
                    cBoxPlot.objs.upperWhisker = {
                        fence: null,
                        line: null
                    };
                    cBoxPlot.objs.lowerWhisker = {
                        fence: null,
                        line: null
                    };
                    cBoxPlot.objs.upperWhisker.fence = cBoxPlot.objs.g.append("line")
                        .attr("class", "upper whisker")
                        .style("stroke", chart.boxPlots.colorFunct(cName));
                    cBoxPlot.objs.upperWhisker.line = cBoxPlot.objs.g.append("line")
                        .attr("class", "upper whisker")
                        .style("stroke", chart.boxPlots.colorFunct(cName));

                    cBoxPlot.objs.lowerWhisker.fence = cBoxPlot.objs.g.append("line")
                        .attr("class", "lower whisker")
                        .style("stroke", chart.boxPlots.colorFunct(cName));
                    cBoxPlot.objs.lowerWhisker.line = cBoxPlot.objs.g.append("line")
                        .attr("class", "lower whisker")
                        .style("stroke", chart.boxPlots.colorFunct(cName));
                }

                // Plot outliers (default show)
                if (bOpts.showOutliers) {
                    if (!cBoxPlot.objs.outliers) calcAllOutliers();
                    var pt;
                    if (cBoxPlot.objs.outliers.length) {
                        var outDiv = cBoxPlot.objs.g.append("g").attr("class", "boxplot outliers");
                        for (pt in cBoxPlot.objs.outliers) {
                            cBoxPlot.objs.outliers[pt].point = outDiv.append("circle")
                                .attr("class", "outlier")
                                .attr('r', bOpts.outlierCSize)
                                .style("fill", chart.boxPlots.colorFunct(cName));
                        }
                    }

                    if (cBoxPlot.objs.extremes.length) {
                        var extDiv = cBoxPlot.objs.g.append("g").attr("class", "boxplot extremes");
                        for (pt in cBoxPlot.objs.extremes) {
                            cBoxPlot.objs.extremes[pt].point = extDiv.append("circle")
                                .attr("class", "extreme")
                                .attr('r', bOpts.outlierCSize)
                                .style("stroke", chart.boxPlots.colorFunct(cName));
                        }
                    }
                }


            }
        };
        chart.boxPlots.prepareBoxPlot();

        d3.select(window).on('resize.' + chart.selector + '.boxPlot', chart.boxPlots.update);
        chart.boxPlots.update();
        return chart;

    };



    chart.renderDensityPlot = function (options) {
        chart.densityPlots = {};

        var defaultOptions = {
            show: true,
            showDensityPlot: true,
            resolution: 200,
            bandwidth: 20,
            height: 100,
            interpolation: 'cardinal',
            clamp: 1,
            colors: chart.colorFunct,
            _xDomainVP: null, // If the Violin plot is set to close all violin plots, it may need to extend the domain, that extended domain is stored here            
        };
        chart.densityPlots.options = shallowCopy(defaultOptions);
        for (var option in options) {
            chart.densityPlots.options[option] = options[option]
        }
        var vOpts = chart.densityPlots.options;

        for (var cName in chart.groupObjs) {
            chart.groupObjs[cName].density = {};
            chart.groupObjs[cName].density.objs = {};
        }

        chart.densityPlots.change = function (updateOptions) {
            if (updateOptions) {
                for (var key in updateOptions) {
                    vOpts[key] = updateOptions[key]
                }
            }

            for (var cName in chart.groupObjs) {
                chart.groupObjs[cName].density.objs.g.remove()
            }

            chart.densityPlots.prepareDensity();
            chart.densityPlots.update();
        };

        chart.densityPlots.reset = function () {
            chart.densityPlots.change(defaultOptions)
        };
        chart.densityPlots.show = function (opts) {
            if (opts !== undefined) {
                opts.show = true;
                if (opts.reset) {
                    chart.densityPlots.reset()
                }
            } else {
                opts = {
                    show: true
                };
            }
            chart.densityPlots.change(opts);

        };

        chart.densityPlots.hide = function (opts) {
            if (opts !== undefined) {
                opts.show = false;
                if (opts.reset) {
                    chart.densityPlots.reset()
                }
            } else {
                opts = {
                    show: false
                };
            }
            chart.densityPlots.change(opts);

        };

        /**
         * Update the obj values
         */
        chart.densityPlots.update = function () {
            var cName, cDensityPlot;

            for (cName in chart.groupObjs) {
                cDensityPlot = chart.groupObjs[cName].density;

                // Build the sideways, so use the yScale for the xScale and make a new yScale
                var yVScale = chart.xScale.copy();


                // Create the Kernel Density Estimator Function
                cDensityPlot.kde = kernelDensityEstimator(eKernel(vOpts.bandwidth), yVScale.ticks(vOpts.resolution));
                cDensityPlot.kdedata = cDensityPlot.kde(chart.groupObjs[cName].values);

                var interpolateMax = chart.groupObjs[cName].metrics.max,
                    interpolateMin = chart.groupObjs[cName].metrics.min;

                if (vOpts.clamp == 0 || vOpts.clamp == -1) { //

                    interpolateMax = d3.min(cDensityPlot.kdedata.filter(function (d) {
                        return (d.y > chart.groupObjs[cName].metrics.max && d.x == 0)
                    }), function (d) {
                        return d.y;
                    });

                    interpolateMin = d3.max(cDensityPlot.kdedata.filter(function (d) {
                        return (d.y < chart.groupObjs[cName].metrics.min && d.x == 0)
                    }), function (d) {
                        return d.y;
                    });

                    if (vOpts.clamp == -1) {
                        kdeTester = eKernelTest(eKernel(vOpts.bandwidth), chart.groupObjs[cName].values);
                        if (!interpolateMax) {
                            var interMaxX = kdeTester(chart.groupObjs[cName].metrics.max);
                            var interMaxY = chart.groupObjs[cName].metrics.max;

                            var count = 25; // Arbitrary limit to make sure we don't get an infinite loop

                            while (count > 0 && interMaxX != 0) {
                                interMaxX = kdeTester(interMaxY);
                                interMaxY += 1;
                                count -= 1;
                            }
                            interpolateMax = interMaxY;
                        }
                        if (!interpolateMin) {
                            var interMinX = kdeTester(chart.groupObjs[cName].metrics.min);
                            var interMinY = chart.groupObjs[cName].metrics.min;
                            var count = 25; // Arbitrary limit to make sure we don't get an infinite loop
                            while (count > 0 && interMinX != 0) {
                                interMinX = kdeTester(interMinY);
                                interMinY -= 1;
                                count -= 1;
                            }
                            interpolateMin = interMinY;
                        }

                    }

                    if (!vOpts._xDomainVP) vOpts._xDomainVP = chart.range.slice(0);
                    if (interpolateMin && interpolateMin < vOpts._xDomainVP[0]) {
                        vOpts._xDomainVP[0] = interpolateMin;
                    }
                    if (interpolateMax && interpolateMax > vOpts._xDomainVP[1]) {
                        vOpts._xDomainVP[1] = interpolateMax;
                    }

                }


                if (vOpts.showDensityPlot) {
                    chart.update();
                    yVScale = chart.xScale.copy();

                    cDensityPlot.kde = kernelDensityEstimator(eKernel(vOpts.bandwidth), yVScale.ticks(vOpts.resolution));

                    cDensityPlot.kdedata = cDensityPlot.kde(chart.groupObjs[cName].values);
                }

                cDensityPlot.kdedata = cDensityPlot.kdedata
                    .filter(function (d) {
                        return (!interpolateMin || d.y >= interpolateMin)

                    })
                    .filter(function (d) {
                        return (!interpolateMax || d.y <= interpolateMax)

                    });
            }
            for (cName in chart.groupObjs) {
                cDensityPlot = chart.groupObjs[cName].density;

                // Get the violin width
                var objBounds = getObjHeight(vOpts.height, cName);
                var height = (objBounds.bottom - objBounds.top) / 2;


                var xVScale = d3.scaleLinear()
                    .range([height, 0])
                    .domain([0, d3.max(cDensityPlot.kdedata, function (d) {
                        return d.x;
                    })])
                    .clamp(true);


                var area = d3.area()
                    .x(function (d) {
                        return yVScale(d.y);
                    })
                    .y0(height)
                    .y1(function (d) {
                        return xVScale(d.x);
                    });


//                var line = d3.line()
//                    .y(function (d) {
//                        return xVScale(d.x);
//                    })
//                    .x(function (d) {
//                        return yVScale(d.y)
//                    });


                if (cDensityPlot.objs.top.area) {
                    cDensityPlot.objs.top.area
                        .datum(cDensityPlot.kdedata)
                        .attr("d", area);
//                    cDensityPlot.objs.top.line
//                        .datum(cDensityPlot.kdedata)
//                        .attr("d", line);

//                    cDensityPlot.objs.bottom.area
//                        .datum(cDensityPlot.kdedata)
//                        .attr("d", area);
//                    cDensityPlot.objs.bottom.line
//                        .datum(cDensityPlot.kdedata)
//                        .attr("d", line);
                }



                cDensityPlot.objs.top.g.attr("transform", "rotate(180,0,0)   translate(0,-" + objBounds.top + ") scale(-1,-1)");
//                cDensityPlot.objs.bottom.g.attr("transform", "rotate(180,0,0)  translate(0,-" + objBounds.bottom + ") scale(-1,1)");

            }
        };

        /**
         * Create the svg elements for the violin plot
         */
        chart.densityPlots.prepareDensity = function () {
            var cName, cDensityPlot;

            if (vOpts.colors) {
                chart.densityPlots.color = getColorFunct(vOpts.colors);
            } else {
                chart.densityPlots.color = chart.colorFunct
            }

            if (vOpts.show == false) {
                return
            }

            for (cName in chart.groupObjs) {
                cDensityPlot = chart.groupObjs[cName].density;

                cDensityPlot.objs.g = chart.groupObjs[cName].g.append("g").attr("class", "density-plot");
                cDensityPlot.objs.top = {
                    area: null,
                    line: null,
                    g: null
                };
//                cDensityPlot.objs.bottom = {
//                    area: null,
//                    line: null,
//                    g: null
//                };


                cDensityPlot.objs.top.g = cDensityPlot.objs.g.append("g");
//                cDensityPlot.objs.bottom.g = cDensityPlot.objs.g.append("g");


                if (vOpts.showDensityPlot !== false) {
                    //Area
                    //                    cViolinPlot.objs.left.area = cViolinPlot.objs.left.g.append("path")
                    cDensityPlot.objs.top.area = cDensityPlot.objs.top.g.append("path")
                        .attr("class", "area")
                        .style("fill", chart.densityPlots.color(cName));
                    //                    cViolinPlot.objs.right.area = cViolinPlot.objs.right.g.append("path")
//                    cDensityPlot.objs.bottom.area = cDensityPlot.objs.bottom.g.append("path")
//                        .attr("class", "area")
//                        .style("fill", chart.densityPlots.color(cName));

                    //Lines
                    //                    cViolinPlot.objs.left.line = cViolinPlot.objs.left.g.append("path")
//                    cDensityPlot.objs.top.line = cDensityPlot.objs.top.g.append("path")
//                        .attr("class", "line")
//                        .attr("fill", 'none')
//                        .style("stroke", chart.densityPlots.color(cName));
                    //                    cViolinPlot.objs.right.line = cViolinPlot.objs.right.g.append("path")
//                    cDensityPlot.objs.bottom.line = cDensityPlot.objs.bottom.g.append("path")
//                        .attr("class", "line")
//                        .attr("fill", 'none')
//                        .style("stroke", chart.densityPlots.color(cName));
                }

            }

        };


        function kernelDensityEstimator(kernel, y) {
            return function (sample) {
                return y.map(function (y) {
                    return {
                        y: y,
                        x: d3.mean(sample, function (v) {
                            return kernel(y - v);
                        })
                    };
                });
            };
        }


        function eKernel(scale) {
            return function (u) {
                return Math.abs(u /= scale) <= 1 ? .75 * (1 - u * u) / scale : 0;
            };
        }

        // Used to find the roots for adjusting violin axis
        // Given an array, find the value for a single point, even if it is not in the domain
        function eKernelTest(kernel, array) {
            return function (testX) {
                return d3.mean(array, function (v) {
                    return kernel(testX - v);
                })
            }
        }

        chart.densityPlots.prepareDensity();

        d3.select(window).on('resize.' + chart.selector + '.densityPlot', chart.densityPlots.update);
        chart.densityPlots.update();
        return chart;
    };


    return chart;
}
