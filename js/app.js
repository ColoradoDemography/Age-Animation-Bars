//wait til DOM loads
$(function() {

    //spin.js
    var opts = {
        lines: 13, // The number of lines to draw
        length: 28, // The length of each line
        width: 14, // The line thickness
        radius: 42, // The radius of the inner circle
        scale: 1, // Scales overall size of the spinner
        corners: 1, // Corner roundness (0..1)
        color: '#000', // #rgb or #rrggbb or array of colors
        opacity: 0.25, // Opacity of the lines
        rotate: 0, // The rotation offset
        direction: 1, // 1: clockwise, -1: counterclockwise
        speed: 1, // Rounds per second
        trail: 60, // Afterglow percentage
        fps: 20, // Frames per second when using setTimeout() as a fallback for CSS
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        className: 'spinner', // The CSS class to assign to the spinner
        top: '50%', // Top position relative to parent
        left: '50%', // Left position relative to parent
        shadow: false, // Whether to render a shadow
        hwaccel: false, // Whether to use hardware acceleration
        position: 'absolute' // Element positioning
    }
    var target = document.getElementById('herespin');
    var spinner = new Spinner(opts).spin(target);

    spinner.stop();

    //for jquery history plugin
    History.Adapter.bind(window, 'statechange', function() { // Note: We are using statechange instead of popstate
        var State = History.getState(); // Note: We are using History.getState() instead of event.state
    });

    function parseQueryString() {
        var newstr, objURL;
        newstr = String(window.location.search);
        objURL = {};
        newstr.replace(
            new RegExp("([^?=&]+)(=([^&]*))?", "g"),
            function($0, $1, $2, $3) {
                objURL[$1] = $3;
            });
        return objURL;
    }

    var params = parseQueryString();
  
    //five possible parameters: county, year, stop, pace, hide
    //stop indicates that there is animation, which would run from 'year' to 'stop'
    //pace, how fast the animation runs (higher is slower.  default =400)
    //hide; if this parameter is anything, controls are hidden (for phantomjs)


    //aselect

    var presetcounty = params.county || "000";
    $('#aselect').val(presetcounty);

    //ayear
    var presetyear = params.year || "1990";
    $('#ayear').val(presetyear);

    if (params.hide) {
        $('#controls').hide();
        $('#dlvideo').hide();
        $('#abutton').hide();
    }


    $('#aselect').selectmenu({
            change: function() {
                jsFunction($('#aselect').val());
            }
        }).selectmenu("menuWidget")
        .addClass("overflow");

    $('#ayear').selectmenu({
            change: function() {
                uyear($('#ayear').val());
            }
        }).selectmenu("menuWidget")
        .addClass("overflow");;

    $("#abutton").button()
        .click(function(event) {
            event.preventDefault();
            animate();
        });

    $("#dlvideo").button()
        .click(function(event) {
            event.preventDefault();
            location.href = "https://storage.googleapis.com/age-animation-bars/" + $('#aselect').val() + ".avi";
            //animate();		
        });

    $("#screencap").button()
        .click(function(event) {
            var timedelay = 4000; //4 seconds
            event.preventDefault();
            function makeid() {
                var text = "",
                    possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
                    i;
                for (i = 0; i < 5; i = i + 1) {
                    text = text + possible.charAt(Math.floor(Math.random() * possible.length));
                }
                return text;
            }

            spinner.spin(target);
            console.log(location.href);
            var qstring = location.search;
            if(qstring===""){qstring="?a=1";} //if no querystring
            location.href = 'https://gis.dola.colorado.gov/phantom/screenshot?website=' + encodeURIComponent("https://gis.dola.colorado.gov/Age-Animation-Bars/" + qstring + "&hide=true") + '&file=' + 'ageAnimate' + makeid() + '&timer=' + timedelay + '&width=1050&height=725';
            window.setTimeout(function(){
              spinner.stop();
            }, timedelay);
      


        });




    function commafy(nStr) {
        var x, x1, x2, rgx;

        nStr += '';
        x = nStr.split('.');
        x1 = x[0];
        x2 = x.length > 1 ? '.' + x[1] : '';
        rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }
        return x1 + x2;
    }

    //Width and height
    var w = 1000;
    var h = 500;
    var speed = params.pace || 400;
    var l = 0; //setinterval


    var xpadding = 15; //top and right padding
    var padding = 60; //left padding
    var spadding = 30; //bottom padding



    var year = params.year || 1990;
    var county = params.county || "000";


    document.getElementById('title').innerHTML = changetitle(county);
    document.getElementById('year').innerHTML = year;


    var dataset = eval("_" + county + "_" + String(year));


    var xScale = d3.scale.linear()
        .domain([0, 90])
        .range([padding, w - xpadding]);

    var yScale = d3.scale.linear()
        .domain([0, maxlookup(county)])
        .range([0, h - (spadding + xpadding)]);

    var yScaleAxis = d3.scale.linear()
        .domain([0, maxlookup(county)])
        .range([h - spadding, xpadding]);




    function make_x_axis() {
        return d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .ticks(11)
    }

    function make_y_axis() {
        return d3.svg.axis()
            .scale(yScaleAxis)
            .orient("left")
            .ticks(10)
    }


    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(11);

    var yAxis = d3.svg.axis()
        .scale(yScaleAxis)
        .orient("left")
        .ticks(10);

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "Age: <span style='color:white'>" + (Number(year) - Number(d.k)) + "</span><br />Birth Year: <span style='color:white'>" + (Number(d.k)) + "</span><br />Population: <span style='color:white'>" + commafy(d.v) + "</span>";
        })

    //Create SVG element
    var svg = d3.select("body")
        .append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("id", "mainsvg");


    svg.call(tip);

    svg.append("g")
        .attr("class", "xaxis")
        .attr("transform", "translate(0," + (h - spadding) + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "yaxis")
        .attr("transform", "translate(" + (padding - 5) + ", -2)")
        .call(yAxis);

    svg.append("g")
        .attr("class", "grid")
        .attr("id", "xgrid")
        .attr("transform", "translate(0," + (h - spadding) + ")")
        .call(make_x_axis()
            .tickSize(-h, 0, 0)
            .tickFormat("")
        );

    svg.append("g")
        .attr("class", "grid")
        .attr("id", "ygrid")
        .attr("transform", "translate(" + (padding - 5) + ", " + (-2) + ")")
        .call(make_y_axis()
            .tickSize(-w, 0, 0)
            .tickFormat("")
        );


    //Define key function, to be used when binding data
    var k = function(d) {
        return d.k;
    };

    //Create bars
    svg.selectAll("rect")
        .data(dataset, k)
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return (padding - 4 + ((year - d.k) * 10.265));
        })
        .attr("y", function(d) {
            return (h - yScale(d.v)) - spadding - 2;
        })
        .attr("width", 7.5)
        .attr("height", function(d) {
            return yScale(d.v);
        })
        .attr("fill", function(d) {
            var cyear = (d.k);
            if (cyear < 1928) {
                creturn = "rgba(247, 150, 70, 0.9)";
            }
            if (cyear > 1927 && cyear < 1946) {
                creturn = "rgba(75, 172, 198, 0.9)";
            }
            if (cyear > 1945 && cyear < 1965) {
                creturn = "rgba(128, 100, 162, 0.9)";
            }
            if (cyear > 1964 && cyear < 1981) {
                creturn = "rgba(155, 187, 89, 0.9)";
            }
            if (cyear > 1980 && cyear < 1997) {
                creturn = "rgba(192, 80, 77, 0.9)";
            }
            if (cyear > 1996 && cyear < 2015) {
                creturn = "rgba(0, 0, 255, 0.9)";
            }
            if (cyear > 2014 && cyear < 2030) {
                creturn = "rgba(102, 51, 0, 0.9)";
            }
            if (cyear > 2029) {
                creturn = "rgba(79, 129, 189, 0.9)";
            }
            return creturn;
        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);


    //automatically kicks into animation mode if stop parameter is set
    if (parseInt(params.stop, 10) > 0) {
        setTimeout(function() {
            animate();
        }, 10);
    }

    function update() {

        dataset = eval("_" + county + "_" + String(year));

        //Select…
        var bars = svg.selectAll("rect")
            .data(dataset, k);


        bars.enter().append("rect")
            .attr("x", function(d) {
                return (padding - 4 + ((year - d.k) * 10.265));
            })
            .attr("y", function(d) {
                return (h - yScale(d.v)) - spadding - 2;
            })
            .attr("width", 7.5)
            .attr("height", function(d) {
                return yScale(d.v);
            })
            .attr("fill", function(d) {
                var cyear = (d.k);
                if (cyear < 1928) {
                    creturn = "rgba(247, 150, 70, 0.9)";
                }
                if (cyear > 1927 && cyear < 1946) {
                    creturn = "rgba(75, 172, 198, 0.9)";
                }
                if (cyear > 1945 && cyear < 1965) {
                    creturn = "rgba(128, 100, 162, 0.9)";
                }
                if (cyear > 1964 && cyear < 1981) {
                    creturn = "rgba(155, 187, 89, 0.9)";
                }
                if (cyear > 1980 && cyear < 1997) {
                    creturn = "rgba(192, 80, 77, 0.9)";
                }
                if (cyear > 1996 && cyear < 2015) {
                    creturn = "rgba(0, 0, 255, 0.9)";
                }
                if (cyear > 2014 && cyear < 2030) {
                    creturn = "rgba(102, 51, 0, 0.9)";
                }
                if (cyear > 2029) {
                    creturn = "rgba(79, 129, 189, 0.9)";
                }
                return creturn;
            })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);

        //Update…
        bars.transition()
            .duration(speed)
            .ease("linear")
            .attr("x", function(d) {
                return (padding - 4 + ((year - d.k) * 10.265));
            })
            .attr("y", function(d) {
                return (h - yScale(d.v)) - spadding - 2;
            })
            .attr("width", 7.5)
            .attr("height", function(d) {
                return yScale(d.v);
            })
            .attr("fill", function(d) {
                var cyear = (d.k);
                if (cyear < 1928) {
                    creturn = "rgba(247, 150, 70, 0.9)";
                }
                if (cyear > 1927 && cyear < 1946) {
                    creturn = "rgba(75, 172, 198, 0.9)";
                }
                if (cyear > 1945 && cyear < 1965) {
                    creturn = "rgba(128, 100, 162, 0.9)";
                }
                if (cyear > 1964 && cyear < 1981) {
                    creturn = "rgba(155, 187, 89, 0.9)";
                }
                if (cyear > 1980 && cyear < 1997) {
                    creturn = "rgba(192, 80, 77, 0.9)";
                }
                if (cyear > 1996 && cyear < 2015) {
                    creturn = "rgba(0, 0, 255, 0.9)";
                }
                if (cyear > 2014 && cyear < 2030) {
                    creturn = "rgba(102, 51, 0, 0.9)";
                }
                if (cyear > 2029) {
                    creturn = "rgba(79, 129, 189, 0.9)";
                }
                return creturn;
            });


        bars.exit().remove();

    }


    function animate() {
        var stopyear = parseInt(params.stop, 10) || 2050;


        if (l == 0) {
            l = window.setInterval(updatefunc, speed);
        } else {

            //if animate button pressed, but animation active.  stop animation.  set dropdown year to correct year.  update url string.

            clearInterval(l);
            l = 0;

            $('#ayear').val(year);
            $("#ayear").selectmenu("refresh");

            //create a URL string with all variables not at a default value
            urlstr = '?' + 'county=' + $('#aselect').val() + '&year=' + year;
            newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + urlstr;

            History.pushState({
                path: newurl
            }, '', newurl);

        }

        function updatefunc() {

            year++;

            if (year > stopyear) {
                clearInterval(l);
                year = stopyear;
                l = 0;
                var presetyear = params.stop || "2050";
                presetyear = presetyear.toString();
                $('#ayear').val(presetyear);
                $("#ayear").selectmenu("refresh");

                //create a URL string with all variables not at a default value
                urlstr = '?' + 'county=' + $('#aselect').val() + '&year=' + $('#ayear').val();
                newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + urlstr;

                History.pushState({
                    path: newurl
                }, '', newurl);

            } else {
                document.getElementById('year').innerHTML = year;
                update();
            }
        }



    }



    function jsFunction(pvalue) {



        //create a URL string with all variables not at a default value
        urlstr = '?' + 'county=' + pvalue + '&year=' + year;
        newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + urlstr;

        History.pushState({
            path: newurl
        }, '', newurl);

        clearInterval(l);
        l = 0;

        county = pvalue;

        dataset = eval("_" + county + "_" + String(year));


        datasetmax = eval("_" + county + "_2050");

        yScale.domain([0, maxlookup(county)]);

        yScaleAxis.domain([0, maxlookup(county)]);



        svg.select(".yaxis")
            .transition().duration(300).ease("linear")
            .call(yAxis);

        svg.select("#ygrid")
            .transition().duration(300).ease("linear")
            .call(make_y_axis()
                .tickSize(-w, 0, 0)
                .tickFormat("")
            );

        document.getElementById('title').innerHTML = changetitle(county);


        update();

    }


    function maxlookup(county) {
        var years = [];
        for (i = 0; i < 61; i++) {
            years[i] = d3.max(eval("_" + county + "_" + String(1990 + i)), function(d) {
                return d.v;
            })
        }
        return Math.max.apply(Math, years);
    }




    function changetitle(pvalue) {
        if (pvalue == "000") {
            return "Colorado";
        }
        if (pvalue == "001") {
            return "Adams County";
        }
        if (pvalue == "003") {
            return "Alamosa County";
        }
        if (pvalue == "005") {
            return "Arapahoe County";
        }
        if (pvalue == "007") {
            return "Archuleta County";
        }
        if (pvalue == "009") {
            return "Baca County";
        }
        if (pvalue == "011") {
            return "Bent County";
        }
        if (pvalue == "013") {
            return "Boulder County";
        }
        if (pvalue == "014") {
            return "Broomfield County";
        }
        if (pvalue == "015") {
            return "Chaffee County";
        }
        if (pvalue == "017") {
            return "Cheyenne County";
        }
        if (pvalue == "019") {
            return "Clear Creek County";
        }
        if (pvalue == "021") {
            return "Conejos County";
        }
        if (pvalue == "023") {
            return "Costilla County";
        }
        if (pvalue == "025") {
            return "Crowley County";
        }
        if (pvalue == "027") {
            return "Custer County";
        }
        if (pvalue == "029") {
            return "Delta County";
        }
        if (pvalue == "031") {
            return "Denver County";
        }
        if (pvalue == "033") {
            return "Dolores County";
        }
        if (pvalue == "035") {
            return "Douglas County";
        }
        if (pvalue == "037") {
            return "Eagle County";
        }
        if (pvalue == "039") {
            return "Elbert County";
        }
        if (pvalue == "041") {
            return "El Paso County";
        }
        if (pvalue == "043") {
            return "Fremont County";
        }
        if (pvalue == "045") {
            return "Garfield County";
        }
        if (pvalue == "047") {
            return "Gilpin County";
        }
        if (pvalue == "049") {
            return "Grand County";
        }
        if (pvalue == "051") {
            return "Gunnison County";
        }
        if (pvalue == "053") {
            return "Hinsdale County";
        }
        if (pvalue == "055") {
            return "Huerfano County";
        }
        if (pvalue == "057") {
            return "Jackson County";
        }
        if (pvalue == "059") {
            return "Jefferson County";
        }
        if (pvalue == "061") {
            return "Kiowa County";
        }
        if (pvalue == "063") {
            return "Kit Carson County";
        }
        if (pvalue == "065") {
            return "Lake County";
        }
        if (pvalue == "067") {
            return "La Plata County";
        }
        if (pvalue == "069") {
            return "Larimer County";
        }
        if (pvalue == "071") {
            return "Las Animas County";
        }
        if (pvalue == "073") {
            return "Lincoln County";
        }
        if (pvalue == "075") {
            return "Logan County";
        }
        if (pvalue == "077") {
            return "Mesa County";
        }
        if (pvalue == "079") {
            return "Mineral County";
        }
        if (pvalue == "081") {
            return "Moffat County";
        }
        if (pvalue == "083") {
            return "Montezuma County";
        }
        if (pvalue == "085") {
            return "Montrose County";
        }
        if (pvalue == "087") {
            return "Morgan County";
        }
        if (pvalue == "089") {
            return "Otero County";
        }
        if (pvalue == "091") {
            return "Ouray County";
        }
        if (pvalue == "093") {
            return "Park County";
        }
        if (pvalue == "095") {
            return "Phillips County";
        }
        if (pvalue == "097") {
            return "Pitkin County";
        }
        if (pvalue == "099") {
            return "Prowers County";
        }
        if (pvalue == "101") {
            return "Pueblo County";
        }
        if (pvalue == "103") {
            return "Rio Blanco County";
        }
        if (pvalue == "105") {
            return "Rio Grande County";
        }
        if (pvalue == "107") {
            return "Routt County";
        }
        if (pvalue == "109") {
            return "Saguache County";
        }
        if (pvalue == "111") {
            return "San Juan County";
        }
        if (pvalue == "113") {
            return "San Miguel County";
        }
        if (pvalue == "115") {
            return "Sedgwick County";
        }
        if (pvalue == "117") {
            return "Summit County";
        }
        if (pvalue == "119") {
            return "Teller County";
        }
        if (pvalue == "121") {
            return "Washington County";
        }
        if (pvalue == "123") {
            return "Weld County";
        }
        if (pvalue == "125") {
            return "Yuma County";
        }

    }

    function uyear(newyear) {

        //create a URL string with all variables not at a default value
        urlstr = '?' + 'county=' + $('#aselect').val() + '&year=' + newyear;
        newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + urlstr;

        History.pushState({
            path: newurl
        }, '', newurl);

        clearInterval(l);
        l = 0;
        year = newyear;


        document.getElementById('year').innerHTML = year;


        update();
    }


});
