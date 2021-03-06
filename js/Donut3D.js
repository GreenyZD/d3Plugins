var d3Pie3D = (function(){
    var Donut3D = function(container,option){
        var width = container[0][0].clientWidth;
        var height = container[0][0].clientHeight;
        //this.rx = (d3.min([width,height])-30) / 2;
        //this.ry = 0.618 * rx;
        this.options = Object.assign({},{
            id : '',
            data : [],
            x : width / 2 , /*center x*/
            y : height / 2 , /*center y*/
            h : 30 ,  /*height*/
            ir : 0  /*inner radius*/,
            multi : 1.3,
            //rx : (d3.min([width,height])-60) / 2.6 / 0.618, /*radius x*/
            //ry : (d3.min([width,height])-60) / 2.6,/*radius y*/
            //rx : d3.min([width/2*1.3,height/2*1.3])-60, /*radius x*/
            //ry : 0.618 * d3.min([width/2*1.3,height/2*1.3])-60,/*radius y*/
            rx : (d3.min([width,height])-30) / 2 , /*radius x*/
            ry : 0.618 * (d3.min([width,height])-30) / 2 ,
            rotate : -30,
            lightImageSrc : '',
            colorSet : ['#66e690','#7bdb74','#a1d271','#82bf9a','#e0e46e','#c8ce81','#83c89a','#83c4b7','#90a7bd',
                '#6dcde3','#e66495','#d46b6a','#df8c5f','#da9779','#c4da77','#b56ed2','#a684be','#7e7cc8','#719ed5','#408bd7'].sort(function(){ return 0.5 - Math.random() })
        },option);

        this.pieX = this.options.x;
        this.pieY = this.options.y;
        this.rx = this.options.rx;
        this.ry = this.options.ry;
        this.data = this.options.data;
        this.svg = container.append("svg").attr({
            width : width,
            height : height,
            viewBox : '0,0,' + width + ',' + height + '',
            preserveAspectRatio : "none meet",
            id : this.options.id ?   this.options.id + 'Svg' : ''
        });

        this.draw();
        var _this = this;
        window.addEventListener('resize',function(){_this.resize();});

    };
    Donut3D.prototype = {
        draw : function(){
            var _this = this;

            var svg = _this.svg;
            var rx = _this.rx,
                ry = _this.ry,
                id = _this.options.id,
                h = _this.options.h,
                ir = _this.options.ir,
                multi = _this.options.multi;

            var data = _this.data.map(function(d,i){return { label: d.label, value: d.value,color:_this.options.colorSet[i] }});
            var pieData = d3.layout.pie().sort(null).value(function(d) {return d.value;})(data);
            var _key = function(d){ return d.data.label; };
            var extendLen = rx/3;

            var allPercent = 0;
            var slices = svg.append("g").attr("transform", "translate(" + _this.pieX + "," + _this.pieY + ") rotate(" + _this.options.rotate+ ")").attr("class", "slices");
            var labels = svg.append("g").attr("transform", "translate(" + _this.pieX + "," + _this.pieY + ")").attr("class", "labels");
            var lines = svg.append("g").attr("transform", "translate(" + _this.pieX + "," + _this.pieY + ")").attr("class", "lines");

            slices.selectAll(".innerSlice").data(pieData).enter().append("path").attr("class", "innerSlice")
                .attr("fill", function(d) { return d3.hsl(d.data.color).darker(0.7); })
                .transition().duration(750)
                .attr("d",function(d){ return pieInner(d, rx+0.5,ry+0.5, h, ir);});

            slices.selectAll(".bottomSlice").data(pieData).enter().append("path").attr("class", "bottomSlice")
                .attr("fill", function(d) { return d3.hsl(d.data.color).darker(1); })
                .transition().duration(150)
                .attr("d",function(d){return pieBottom(d, rx-.5,ry-.5, ir,h);});

            slices.selectAll(".side").data(pieData).enter().append("path").attr("class", "side")
                .attr("fill", '#222')
                .transition().duration(150)
                .attr("d",function(d){return pieSide(d, rx-.5,ry-.5, h);});

            slices.selectAll(".outerSlice").data(pieData).enter().append("path").attr("class", "outerSlice")
                .attr("fill", function(d) { return d3.hsl(d.data.color).darker(0.7); })
                .attr("fill-opacity", 0.9)
                .transition().duration(150)
                .attr("d",function(d){return pieOuter(d, rx-.5,ry-.5, h);});


            slices.selectAll(".topSlice").data(pieData).enter().append("path").attr("class", "topSlice")
                .attr("fill", function(d) { return d.data.color; })
                .attr("fill-opacity",0.8)
                .transition().duration(150)
                .attr("d",function(d){ return pieTop(d, rx, ry, ir);});

            labels.selectAll(".percent").data(pieData).enter().append("text").attr("class", "percent")
                .transition().duration(750)
                .attr("x",function(d){ return 0.5*lineX(d,rx,ry);})
                .attr("y",function(d){ return 0.5*lineY(d,rx,ry);})
                .text(function(d,i){
                    var thisPercent = getPercent(d);
                    if(i == data.length-1){
                        return (100 - allPercent).toFixed(1)+'%';
                    }else{
                        allPercent += thisPercent;
                        return thisPercent +'%';
                    }
                });


            var labelGroup = lines.selectAll(".labelGroup").data(pieData, _key).enter().append("g").attr("class", "labelGroup");
            labelGroup.append("text").attr("class", "labelsText")
                .attr("dy", ".35em").attr("dx", function(d){return lineX(d,rx,ry) > 0 ? ".35em" : "-.35em";})
                .text(function(d) {return d.data.label;})
                .attr('fill',function(d){return d.data.color;});
            labelGroup.append("polyline").attr("class", "labelPolyline")
                .attr("fill", 'none')
                .style("stroke", function(d) { return d.data.color; })
                .transition().duration(750)
                .attr("points", function(d){
                    var x = lineX(d,rx,ry);
                    var y = lineY(d,rx,ry);

                    var text = d3.select(this.parentNode).select('text');
                    var bbox = text[0][0].getBBox();
                    var tmpX = _this.pieX - multi*Math.abs(x) - bbox.width;
                    var tmp = tmpX < 0 ? 0 : (tmpX < extendLen ? tmpX : extendLen);
                    var mulY = multi*y > ry ? multi*y+h : multi*y;
                    text.attr("transform", "translate(0,0)")
                        .transition().duration(750)
                        .attr("transform", "translate("+ [x < 0 ? (multi*x - tmp) : (multi*x + tmp),mulY] +")")
                        .style("text-anchor",x > 0 ? "start":"end")
                        .text(function(d){
                            if(tmp == 0){
                                var max = _this.pieX - multi*Math.abs(x) - 20;
                                var sliceArr = splitByLine(d.data.label,max,14);
                                return sliceArr[0].substring(0,sliceArr[0].length-1) + '...';
                            }else{
                                return d.data.label;
                            }
                        });
                    return [[0.6*x,0.6*y],[multi*x,mulY],[x < 0 ? (multi*x - tmp) : (multi*x + tmp),mulY]];
                });

            if(_this.options.lightImageSrc){
                slices.append('image').attr({
                    'xlink:href' : _this.options.lightImageSrc,
                    width : 2*rx,
                    height : 2*ry,
                    x : -rx,
                    y : -ry,
                    class : 'lightImage',
                    preserveAspectRatio : "none meet"
                })
                    .style('pointer-events','none');
                //slices.style('pointer-events','none');
            }

            var tip = d3.select(d3.select('body').select('.d3ChartTips')[0][0] || d3.select('body').append('div').attr('class','d3ChartTips')
                    .style({position: 'fixed', width: 'auto', height: 'auto', 'font-size': '14px', 'text-align': 'left','display':'none','word-wrap': 'break-word',
            'word-break': 'break-all', 'padding': '8px 15px 8px 15px', 'background-color': '#03101b', 'opacity': '0.75', 'border-radius': '2px', 'color': '#BEE2EB'})[0][0]);

            slices.selectAll('path').on('mouseover',function(d){

                tip.html(d.data.label + "<br />" + "响应时间:"
                    + d.data.value+ "ms"
                    + '(' + Math.round(1000*(d.endAngle-d.startAngle)/(Math.PI*2))/10 +'%)')
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY + 10) + "px")
                    .style('display','block');
            })
                .on('mousemove',function(d){
                    tip.style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY + 10) + "px")
                        .style('display','block');
                })
                .on('mouseout',function(){tip.style('display','none');});

        },
        resize : function(){

            var _this = this;
            var h = _this.options.h;
            var ir = _this.options.ir;
            var multi = _this.options.multi;

            var svg = _this.svg;
            var slices = svg.select('.slices');
            var labels = svg.select('.labels');
            var lines = svg.select('.lines');

            var width = svg[0][0].parentNode.clientWidth;
            var height = svg[0][0].parentNode.clientHeight;
            //console.log('宽 ： ' + width);
            //console.log('高 ： ' + height);
            _this.pieX = width/2;
            _this.pieY = height/ 2;
            //var rx = _this.rx = (d3.min([width,height])-60) / (2 * multi) / 0.618;/*radius x*/
            //var ry = _this.ry = (d3.min([width,height])-60) / (2 * multi);/*radius y*/
            var rx = _this.rx = (d3.min([width,height])-30) / 2 ;/*radius x*/
            var ry = _this.ry = rx * 0.618;/*radius y*/
            var extendLen = rx/3;


            svg.attr({viewBox : '0,0,' + width + ',' + height + '', width :width, height :height});
            slices.attr("transform", "translate(" + _this.pieX + "," + _this.pieY + ") rotate(" + _this.options.rotate + ")");
            labels.attr("transform", "translate(" + _this.pieX + "," + _this.pieY + ")");
            lines.attr("transform", "translate(" + _this.pieX + "," + _this.pieY + ")");

            !svg.select('.lightImage').empty() && svg.select('.lightImage').attr({width : 2*rx, height : 2*ry, x : -rx, y : -ry});
            if(!svg.select('.innerSlice').empty()){
                svg.selectAll(".innerSlice").attr("d",function(d){ return pieInner(d, rx+0.5,ry+0.5, h, ir);});
                svg.selectAll(".bottomSlice").attr("d",function(d){return pieBottom(d, rx-.5,ry-.5, ir,h);});
                svg.selectAll(".side").attr("d",function(d){return pieSide(d, rx-.5,ry-.5, h);});
                svg.selectAll(".outerSlice").attr("d",function(d){return pieOuter(d, rx-.5,ry-.5, h);});
                svg.selectAll(".topSlice").attr("d",function(d){ return pieTop(d, rx, ry, ir);});

                svg.selectAll(".percent")
                    .attr("x",function(d){return 0.5 * lineX(d,rx,ry);})
                    .attr("y",function(d){ return 0.5 * lineY(d,rx,ry);});


                svg.selectAll(".labelsText")
                    .attr("dx", function(d){return lineX(d) > 0 ? ".35em" : "-.35em";});

                svg.selectAll(".labelPolyline")
                    .attr("points", function(d){
                        var text = d3.select(this.parentNode).select('text');
                        text.text(function(d){return d.data.label;});
                        var x = lineX(d,rx,ry);
                        var y = lineY(d,rx,ry);
                        var bbox = text[0][0].getBBox();
                        var tmpX = _this.pieX - multi*Math.abs(x) - bbox.width - 20;
                        var tmp = tmpX < 0 ? 0 : (tmpX < extendLen ? tmpX : extendLen);
                        var mulY = multi*y > ry ? multi*y+h : multi*y;
                        text.attr("transform", "translate("+ [x < 0 ? (multi*x - tmp) : (multi*x + tmp),mulY] +")")
                            .style("text-anchor",x > 0 ? "start":"end")
                            .text(function(d){
                                if(tmp == 0){
                                    var max = _this.pieX - multi*Math.abs(x) - 20;
                                    var sliceArr = splitByLine(d.data.label,max,14);
                                    return sliceArr[0].substring(0,sliceArr[0].length-1) + '...';
                                }else{
                                    return d.data.label;
                                }
                                //
                                //var max = _this.pieX - multi*Math.abs(x) - Math.abs(tmp) - 20;
                                //var sliceArr = splitByLine(d.data.label,max,14);
                                //return sliceArr.length > 1 ? sliceArr[0].substring(0,sliceArr[0].length-1) + '...' : d.data.label;
                            });

                        return [[0.6*x,0.6*y],[multi*x,mulY],[x < 0 ? (multi*x - tmp) : (multi*x + tmp),mulY]];
                    });
            }

        }
    };

    return Donut3D;


    /**
     * 计算椭圆点到圆心的距离
     * @param angle
     * @param rx
     * @param ry
     * @returns {number}
     */
    function getOffsetX(angle,rx,ry){
        var k = Math.tan(angle);
        var rxP = rx*rx;
        var ryP = ry*ry;
        return Math.sqrt((rxP * ryP) / (rxP*k*k + ryP) * (1+k*k));
    }

    /**
     * 获取开始角度和结束角度的椭圆点x\y值
     * @param startAngle
     * @param endAngle
     * @param rx
     * @param ry
     * @returns {{sx: number, sy: number, ex: number, ey: number}}
     */
    function getXY(startAngle,endAngle,rx,ry){
        endAngle = endAngle > 2*Math.PI ? 2*Math.PI : endAngle;

        var lineS = getOffsetX(startAngle,rx,ry);
        var lineE = getOffsetX(endAngle,rx,ry);
        return {
            sx : lineS*Math.cos(startAngle),
            sy : lineS*Math.sin(startAngle),
            ex : lineE*Math.cos(endAngle),
            ey : lineE*Math.sin(endAngle)
        }
    }

    function pieTop(d, rx, ry, ir ){
        if(d.endAngle - d.startAngle == 0 ) return "M 0 0";
        var se = getXY(d.startAngle,d.endAngle,rx,ry);
        var ret =[];
        ret.push("M",se.sx,se.sy,"A",rx,ry,"0",(d.endAngle-d.startAngle > Math.PI? 1: 0),"1",se.ex,se.ey,"L",ir*se.ex,ir*se.ey);
        ret.push("A",ir*rx,ir*ry,"0",(d.endAngle-d.startAngle > Math.PI? 1: 0), "0",ir*se.sx,ir*se.sy,"z");
        return ret.join(" ");
    }

    function pieBottom(d, rx, ry,ir, h ){
        if(d.endAngle - d.startAngle == 0 ) return "M 0 0";
        var se = getXY(d.startAngle,d.endAngle,rx,ry);

//        A RX,RY,XROTATION,FLAG1,FLAG2,X,Y
//
//        RX,RY指所在椭圆的半轴大小
//        XROTATION指椭圆的X轴与水平方向顺时针方向夹角，可以想像成一个水平的椭圆绕中心点顺时针旋转XROTATION的角度。
//        FLAG1只有两个值，1表示大角度弧线，0为小角度弧线。
//        FLAG2只有两个值，确定从起点至终点的方向，1为顺时针，0为逆时针
//        X,Y为终点坐标

        var ret =[];
        ret.push("M",se.sx,h+se.sy,"A",rx,ry,"0",(d.endAngle-d.startAngle > Math.PI? 1: 0),"1",se.ex,h+se.ey,"L",ir*se.ex,ir*se.ey + h);
        ret.push("A",ir*rx,ir*ry,"0",(d.endAngle-d.startAngle > Math.PI? 1: 0), "0",ir*se.sx,ir*se.sy + h,"z");
        return ret.join(" ");
    }

    function pieOuter(d, rx, ry, h ){
        var startAngle = (d.startAngle > Math.PI ? Math.PI : d.startAngle);
        var endAngle = (d.endAngle > Math.PI ? Math.PI : d.endAngle);
        var se = getXY(startAngle,endAngle,rx,ry);
        var ret =[];
        ret.push("M",se.sx,h+se.sy,"A",rx,ry,"0 0 1",se.ex,h+se.ey,"L",se.ex,se.ey,"A",rx,ry,"0 0 0",se.sx,se.sy,"z");
        return ret.join(" ");
    }

    function pieInner(d, rx, ry, h, ir ){
        var startAngle = (d.startAngle < Math.PI ? Math.PI : d.startAngle);
        var endAngle = (d.endAngle < Math.PI ? Math.PI : d.endAngle);

        var se = getXY(startAngle,endAngle,rx,ry);
        var sx = ir*se.sx,
            sy = ir*se.sy,
            ex = ir*se.ex,
            ey = ir*se.ey;

        var ret =[];
        ret.push("M",sx, sy,"A",ir*rx,ir*ry,"0 0 1",ex,ey, "L",ex,h+ey,"A",ir*rx, ir*ry,"0 0 0",sx,h+sy,"z");
        return ret.join(" ");
    }

    function pieSide(d, rx, ry, h ){
        if(d.endAngle - d.startAngle == 0 ) return "M 0 0";
        var se = getXY(d.startAngle,d.endAngle,rx,ry);
        var ret =[];
        ret.push("M",se.ex,se.ey+h,"L 0 ",h,"L 0 0"," L", se.ex,se.ey ," z");
        ret.push("M",se.sx,se.sy+h,"L 0 ",h,"L 0 0 "," L", se.sx,se.sy ," z");
        return ret.join(" ");
    }

    function getPercent(d){
        return Math.round(1000*(d.endAngle-d.startAngle)/(Math.PI*2))/10;
    }

    function lineX(d,rx,ry){
        var angle = 0.5*(d.startAngle + d.endAngle)-1/6*Math.PI;   // 减去30偏移
        return getOffsetX(angle,rx,ry)*Math.cos(angle);
    }
    function lineY(d,rx,ry){
        var angle = 0.5*(d.startAngle + d.endAngle)-1/6*Math.PI;
        return getOffsetX(angle,rx,ry)*Math.sin(angle);
    }

    /**
     * 分割字符串
     * @param str
     * @param max 宽度
     * @param fontsize
     * @returns {Array}
     */
    function splitByLine(str,max,fontsize){
        fontsize = fontsize || 14;
        var curLen = 0;
        var result = [];
        var start = 0, end = 0;
        for(var i=0;i<str.length;i++){
            var code = str.charCodeAt(i);
            var pixelLen = code > 255 ? fontsize : fontsize/2;
            curLen += pixelLen;
            if(curLen > max){
                end = i;
                result.push(str.substring(start,end));
                start = i;
                curLen = pixelLen;
            }
            if( i === str.length - 1 ){
                end = i;
                result.push(str.substring(start,end+1));
            }
        }
        return result;
    }
})();


