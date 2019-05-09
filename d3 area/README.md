# D3-Area-Range-Line-Plugin

## Getting Started

Include `jtv.arearange.line.css`,`d3.v3.min.js` and`jtv.arearange.line.js` in your HTML. 

```HTML
<link href="css/jtv.arearange.line.css" rel="stylesheet">
<script src="//d3js.org/d3.v3.min.js"></script>
<script src="js/jtv.arearange.line.js"></script>
```
Provide JSON data for plotting

```javascript
var retdata = [
                {
                    key: "Reg User",
                    values: [
                        {"date": "20101001", "low": 3, "high": 5, "avg": 4},
                        {"date": "20101002", "low": 6, "high": 8, "avg": 7},
                        {"date": "20101003", "low": 4, "high": 6, "avg": 5},
                        {"date": "20101004", "low": 6, "high": 8, "avg": 7},
                        {"date": "20101005", "low": 5, "high": 7, "avg": 6}
                        
                    ]
                },
                {
                    key: "Guest User",
                    values: [
                        {"date": "20101001", "low": 6, "high": 8, "avg": 7},
                        {"date": "20101002", "low": 3, "high": 5, "avg": 4},
                        {"date": "20101003", "low": 5, "high": 7, "avg": 6},
                        {"date": "20101004", "low": 2, "high": 4, "avg": 3},
                        {"date": "20101005", "low": 6, "high": 8, "avg": 7}
                        
                    ]
                }
            ];     
```

![alt text](https://github.com/JunctionTV/D3-Area-Range-Line-Plugin/blob/master/images/area-rangeline-date.png "Area Range line chart")

### Provide Chart options

##### Axes Options: 
    xLabel : X Label Text (i.e. Date)
    yLabel : Y Label Text (i.e Count)
    yAxisLabelPos :To set the Y-axis label position in inner side or outer side of the Y-axis (i.e. inner or outer)
    xScale : Format of the X-axis, Date time or any string value (i.e. datetime, str)

##### Line Options:
    strokeWidth : Width of the stroke
    areaOpacity : Opacity of the area
    interpolate : Different shape of the line and area(i.e linear, cardinal, monotone etc.)

##### Legend Options:
    enable : Showing legend or not (i.e. true or false)
    legendType : Shape of the legends(i.e. circle, rectangle)   

##### Chart background options:
    bgColor : Background color of the chart
    gridlineWidth : Width of the horizontal grid line
    noofGrids : Number of Y-axis grid lines


