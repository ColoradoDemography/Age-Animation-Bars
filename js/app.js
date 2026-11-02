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

    var presetcounty = params.county || 0;
    $('#aselect').val(presetcounty);

    //ayear
    var presetyear = params.year || 2024;
    $('#ayear').val(presetyear);

    if (params.hide) {
        $('#controls').hide();
        $('#dlvideo').hide();
        $('#abutton').hide();
        $('#attrib').hide();
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



    var year = params.year || 2024;
    var county = params.county || 0;


    document.getElementById('title').innerHTML = changetitle(county);
    document.getElementById('year').innerHTML = year;

    var dataset = getSYA(county,year);
   //var dataset = eval("_" + county + "_" + String(year));
console.log(dataset);

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
        .ticks(10, "s");

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d)
            {var cyear = (Number(d.year)-Number(d.age));
            if (cyear < 1928) {
                creturn = "Greatest Generation";
            }
            if (cyear > 1927 && cyear < 1946) {
                creturn = "Silent Generation";
            }
            if (cyear > 1945 && cyear < 1965) {
                creturn = "Baby Boomers";
            }
            if (cyear > 1964 && cyear < 1981) {
                creturn = "Generation X";
            }
            if (cyear > 1980 && cyear < 1997) {
                creturn = "Millenials";
            }
            if (cyear > 1996 && cyear < 2015) {
                creturn = "Generation Z";
            }
            if (cyear > 2014 && cyear < 2030) {
                creturn = "Generation Alpha";
            }
            if (cyear > 2029) {
                creturn = "Future Generations";
            }
            //return creturn;}
            return "Age: <span style='color:white'>" + (Number(d.age)) + "</span><br />Birth Year: <span style='color:white'>" + (Number(d.year)-Number(d.age)) + "</span><br />Generation: <span style='color:white'>" + creturn + "</span><br />Population: <span style='color:white'>" + commafy(d.totalpopulation) + "</span>";
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
        return (d.age);
    };

    //Create bars
    svg.selectAll("rect")
        .data(dataset, k)
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return (padding - 4 + ((year - (Number(d.year)-Number(d.age))) * 10.265));
        })
        .attr("y", function(d) {
            return (h - yScale(d.totalpopulation)) - spadding - 2;
        })
        .attr("width", 7.5)
        .attr("height", function(d) {
            return yScale(d.totalpopulation);
        })
            .attr("fill", function(d) {
                var cyear = (Number(d.year)-Number(d.age));
                if (cyear < 1928) {
                    creturn = "#001970";
                }
                if (cyear > 1927 && cyear < 1946) {
                    creturn = "#ffd100";
                }
                if (cyear > 1945 && cyear < 1965) {
                    creturn = "#c3002f";
                }
                if (cyear > 1964 && cyear < 1981) {
                    creturn = "#6d3a5d";
                }
                if (cyear > 1980 && cyear < 1997) {
                    creturn = "#7a853b";
                }
                if (cyear > 1996 && cyear < 2015) {
                    creturn = "#35647e";
                }
                if (cyear > 2014 && cyear < 2030) {
                    creturn = "#ef7521";
                }
                if (cyear > 2029) {
                    creturn = "#245d38";
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

        //dataset = eval("_" + county + "_" + String(year));
        dataset = getSYA(county,year);

        //Select…
        var bars = svg.selectAll("rect")
            .data(dataset, k);


        bars.enter().append("rect")
            .attr("x", function(d) {
                return (padding - 4 + ((year - (Number(d.year)-Number(d.age))) * 10.265));
            })
            .attr("y", function(d) {
                return (h - yScale(d.totalpopulation)) - spadding - 2;
            })
            .attr("width", 7.5)
            .attr("height", function(d) {
                return yScale(d.totalpopulation);
            })
           .attr("fill", function(d) {
                var cyear = (Number(d.year)-Number(d.age));
                if (cyear < 1928) {
                    creturn = "#001970";
                }
                if (cyear > 1927 && cyear < 1946) {
                    creturn = "#ffd100";
                }
                if (cyear > 1945 && cyear < 1965) {
                    creturn = "#c3002f";
                }
                if (cyear > 1964 && cyear < 1981) {
                    creturn = "#6d3a5d";
                }
                if (cyear > 1980 && cyear < 1997) {
                    creturn = "#7a853b";
                }
                if (cyear > 1996 && cyear < 2015) {
                    creturn = "#35647e";
                }
                if (cyear > 2014 && cyear < 2030) {
                    creturn = "#ef7521";
                }
                if (cyear > 2029) {
                    creturn = "#245d38";
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
                return (padding - 4 + ((year - (Number(d.year)-Number(d.age))) * 10.265));
            })
            .attr("y", function(d) {
                return (h - yScale(d.totalpopulation)) - spadding - 2;
            })
            .attr("width", 7.5)
            .attr("height", function(d) {
                return yScale(d.totalpopulation);
            })
            .attr("fill", function(d) {
                var cyear = (Number(d.year)-Number(d.age));
                if (cyear < 1928) {
                    creturn = "#001970";
                }
                if (cyear > 1927 && cyear < 1946) {
                    creturn = "#ffd100";
                }
                if (cyear > 1945 && cyear < 1965) {
                    creturn = "#c3002f";
                }
                if (cyear > 1964 && cyear < 1981) {
                    creturn = "#6d3a5d";
                }
                if (cyear > 1980 && cyear < 1997) {
                    creturn = "#7a853b";
                }
                if (cyear > 1996 && cyear < 2015) {
                    creturn = "#35647e";
                }
                if (cyear > 2014 && cyear < 2030) {
                    creturn = "#ef7521";
                }
                if (cyear > 2029) {
                    creturn = "#245d38";
                }
            return creturn;
        })


        bars.exit().remove();

    }


    function animate() {
        var stopyear = parseInt(params.stop, 10) || 2060;


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
                var presetyear = params.stop || "2060";
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

        //dataset = eval("_" + county + "_" + String(year));
        dataset = getSYA(county,year);
        datasetmax = getSYA(county,2060);
        //datasetmax = eval("_" + county + "_2050");

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


    /* function maxlookup(county) {console.log(county);
        var years = [];
        for (i = 0; i < 71; i++) {
            //years[i] = d3.max(eval("_" + county + "_" + String(1990 + i)), function(d) {
            years[i] = d3.max(getSYA(county,(1990 + i)), function(d) {
                return d.totalpopulation;  
                //console.log(d.totalpopulation);
            })
        }
        console.log(Math.max.apply(Math, years));
        return Math.max.apply(Math, years);
    } */

    function maxlookup(pvalue){
        if (pvalue == 0) {
            return 107422;
        }
        if (pvalue == 1) {
            return 11711;
        }
        if (pvalue == 3) {
            return 499;
        }
        if (pvalue == 5) {
            return 13159;
        }
        if (pvalue == 7) {
            return 339;
        }
        if (pvalue == 9) {
            return 93;
        }
        if (pvalue == 11) {
            return 147;
        }
        if (pvalue == 13) {
            return 8555;
        }
        if (pvalue == 14) {
            return 1935;
        }
        if (pvalue == 15) {
            return 455;
        }
        if (pvalue == 17) {
            return 65;
        }
        if (pvalue == 19) {
            return 264;
        }
        if (pvalue == 21) {
            return 185;
        }
        if (pvalue == 23) {
            return 90;
        }
        if (pvalue == 25) {
            return 174;
        }
        if (pvalue == 27) {
            return 169;
        }
        if (pvalue == 29) {
            return 732;
        }
        if (pvalue == 31) {
            return 21404;
        }
        if (pvalue == 33) {
            return 65;
        }
        if (pvalue == 35) {
            return 8608;
        }
        if (pvalue == 37) {
            return 1537;
        }
        if (pvalue == 39) {
            return 694;
        }
        if (pvalue == 41) {
            return 17307;
        }
        if (pvalue == 43) {
            return 984;
        }
        if (pvalue == 45) {
            return 1431;
        }
        if (pvalue == 47) {
            return 169;
        }
        if (pvalue == 49) {
            return 395;
        }
        if (pvalue == 51) {
            return 766;
        }
        if (pvalue == 53) {
            return 40;
        }
        if (pvalue == 55) {
            return 182;
        }
        if (pvalue == 57) {
            return 49;
        }
        if (pvalue == 59) {
            return 10428;
        }
        if (pvalue == 61) {
            return 51;
        }
        if (pvalue == 63) {
            return 194;
        }
        if (pvalue == 65) {
            return 168;
        }
        if (pvalue == 67) {
            return 1161;
        }
        if (pvalue == 69) {
            return 7451;
        }
        if (pvalue == 71) {
            return 318;
        }
        if (pvalue == 73) {
            return 193;
        }
        if (pvalue == 75) {
            return 543;
        }
        if (pvalue == 77) {
            return 3385;
        }
        if (pvalue == 79) {
            return 46;
        }
        if (pvalue == 81) {
            return 272;
        }
        if (pvalue == 83) {
            return 558;
        }
        if (pvalue == 85) {
            return 924;
        }
        if (pvalue == 87) {
            return 557;
        }
        if (pvalue == 89) {
            return 365;
        }
        if (pvalue == 91) {
            return 148;
        }
        if (pvalue == 93) {
            return 438;
        }
        if (pvalue == 95) {
            return 89;
        }
        if (pvalue == 97) {
            return 446;
        }
        if (pvalue == 99) {
            return 272;
        }
        if (pvalue == 101) {
            return 3302;
        }
        if (pvalue == 103) {
            return 172;
        }
        if (pvalue == 105) {
            return 233;
        }
        if (pvalue == 107) {
            return 533;
        }
        if (pvalue == 109) {
            return 160;
        }
        if (pvalue == 111) {
            return 36;
        }
        if (pvalue == 113) {
            return 287;
        }
        if (pvalue == 115) {
            return 58;
        }
        if (pvalue == 117) {
            return 1286;
        }
        if (pvalue == 119) {
            return 606;
        }
        if (pvalue == 121) {
            return 99;
        }
        if (pvalue == 123) {
            return 8716;
        }
        if (pvalue == 125) {
            return 202;
        }
    }


    function changetitle(pvalue) {
        if (pvalue == 0) {
            return "Colorado";
        }
        if (pvalue == 1) {
            return "Adams County";
        }
        if (pvalue == 3) {
            return "Alamosa County";
        }
        if (pvalue == 5) {
            return "Arapahoe County";
        }
        if (pvalue == 7) {
            return "Archuleta County";
        }
        if (pvalue == 9) {
            return "Baca County";
        }
        if (pvalue == 11) {
            return "Bent County";
        }
        if (pvalue == 13) {
            return "Boulder County";
        }
        if (pvalue == 14) {
            return "Broomfield County";
        }
        if (pvalue == 15) {
            return "Chaffee County";
        }
        if (pvalue == 17) {
            return "Cheyenne County";
        }
        if (pvalue == 19) {
            return "Clear Creek County";
        }
        if (pvalue == 21) {
            return "Conejos County";
        }
        if (pvalue == 23) {
            return "Costilla County";
        }
        if (pvalue == 25) {
            return "Crowley County";
        }
        if (pvalue == 27) {
            return "Custer County";
        }
        if (pvalue == 29) {
            return "Delta County";
        }
        if (pvalue == 31) {
            return "Denver County";
        }
        if (pvalue == 33) {
            return "Dolores County";
        }
        if (pvalue == 35) {
            return "Douglas County";
        }
        if (pvalue == 37) {
            return "Eagle County";
        }
        if (pvalue == 39) {
            return "Elbert County";
        }
        if (pvalue == 41) {
            return "El Paso County";
        }
        if (pvalue == 43) {
            return "Fremont County";
        }
        if (pvalue == 45) {
            return "Garfield County";
        }
        if (pvalue == 47) {
            return "Gilpin County";
        }
        if (pvalue == 49) {
            return "Grand County";
        }
        if (pvalue == 51) {
            return "Gunnison County";
        }
        if (pvalue == 53) {
            return "Hinsdale County";
        }
        if (pvalue == 55) {
            return "Huerfano County";
        }
        if (pvalue == 57) {
            return "Jackson County";
        }
        if (pvalue == 59) {
            return "Jefferson County";
        }
        if (pvalue == 61) {
            return "Kiowa County";
        }
        if (pvalue == 63) {
            return "Kit Carson County";
        }
        if (pvalue == 65) {
            return "Lake County";
        }
        if (pvalue == 67) {
            return "La Plata County";
        }
        if (pvalue == 69) {
            return "Larimer County";
        }
        if (pvalue == 71) {
            return "Las Animas County";
        }
        if (pvalue == 73) {
            return "Lincoln County";
        }
        if (pvalue == 75) {
            return "Logan County";
        }
        if (pvalue == 77) {
            return "Mesa County";
        }
        if (pvalue == 79) {
            return "Mineral County";
        }
        if (pvalue == 81) {
            return "Moffat County";
        }
        if (pvalue == 83) {
            return "Montezuma County";
        }
        if (pvalue == 85) {
            return "Montrose County";
        }
        if (pvalue == 87) {
            return "Morgan County";
        }
        if (pvalue == 89) {
            return "Otero County";
        }
        if (pvalue == 91) {
            return "Ouray County";
        }
        if (pvalue == 93) {
            return "Park County";
        }
        if (pvalue == 95) {
            return "Phillips County";
        }
        if (pvalue == 97) {
            return "Pitkin County";
        }
        if (pvalue == 99) {
            return "Prowers County";
        }
        if (pvalue == 101) {
            return "Pueblo County";
        }
        if (pvalue == 103) {
            return "Rio Blanco County";
        }
        if (pvalue == 105) {
            return "Rio Grande County";
        }
        if (pvalue == 107) {
            return "Routt County";
        }
        if (pvalue == 109) {
            return "Saguache County";
        }
        if (pvalue == 111) {
            return "San Juan County";
        }
        if (pvalue == 113) {
            return "San Miguel County";
        }
        if (pvalue == 115) {
            return "Sedgwick County";
        }
        if (pvalue == 117) {
            return "Summit County";
        }
        if (pvalue == 119) {
            return "Teller County";
        }
        if (pvalue == 121) {
            return "Washington County";
        }
        if (pvalue == 123) {
            return "Weld County";
        }
        if (pvalue == 125) {
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

    function getSYA(fips,year){
        if (year < 2010){
            var data = $.ajax({
                url: "https://gis.dola.colorado.gov/lookups/sya?age=0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89&county=" + fips + "&year=" + year + "&choice=single",
                dataType: 'json',
                async: false,
            });
        }

        else {
            var data = $.ajax({
                url: "https://gis.dola.colorado.gov/lookups/sya?county=" + fips + "&year=" + year + "&choice=single",
                dataType: 'json',
                async: false,
            });
        }

    return data.responseJSON;
}

});
