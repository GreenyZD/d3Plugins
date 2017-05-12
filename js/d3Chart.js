var d3Chart = (function(){
    var d3Chart = function (container,type,option){
        this.container = container;
        this.type = type || 'area';
        this.options = Object.assign({},defaultSettings(type),option);

        this.margin = {
            top : this.options.legendStyle == 'top' ? 60 : 30,
            right : 40,
            bottom : (this.type == 'area' || this.type == 'line') && this.options.brushOpen ? (this.options.legendStyle == 'bottom' ? 110 : 80)
                : (this.options.legendStyle == 'bottom' ? 70 : 40),
            left : 70
        };
        this.width = container[0][0].clientWidth - this.margin.left - this.margin.right;
        this.height = container[0][0].clientHeight - this.margin.top - this.margin.bottom;

        if(this.options.brushOpen){
            this.brushMargin = {top: this.height + this.margin.top + 50, right: this.margin.right, bottom: 0, left: this.margin.left};
            this.brushHeight = 25;
        }

        this.id = this.options.id;
        this.data = getData(this.options.data);
        this.xMarks = this.options.xMarks;
        this.maxData = getMaxData(this.data);
        this.minData = getMinData(this.data);

        this.color = [];

        this.draw();
        var _this = this;
        window.addEventListener('resize',function(){_this.resize();});

    };
    d3Chart.prototype = {
        draw : function(){
            var _this = this;
            var width = _this.width;
            var height = _this.height;
            var xMarks = _this.xMarks;
            var type = _this.type;
            var svgWidth = _this.width + _this.margin.left + _this.margin.right;
            var svgHeight = _this.height + _this.margin.top + _this.margin.bottom;

            /** 创建比例尺 **/
            if(type == 'area' || type == 'line'){
                _this.x = d3.scale.linear().range([0, width]).domain([0,(xMarks.length == 1) ? 1 :  xMarks.length-1]);
                _this.y = d3.scale.linear().range([height, 0]).domain([_this.minData, _this.maxData]);
                if(_this.options.brushOpen){
                    _this.brushX = d3.scale.linear().range([0, width]).domain(_this.x.domain());
                    _this.brushY = d3.scale.linear().range([_this.brushHeight, 0]).domain(_this.y.domain());
                }
            }else if(type == 'bar'){
                if(_this.options.direction == 'horizontal'){
                    _this.x = d3.scale.linear().range([0,width]).domain([_this.minData, _this.maxData]);
                    _this.y = d3.scale.ordinal().rangeRoundBands([height,0], .1).domain(xMarks.map(function(d) {return d;}));
                }else{
                    _this.x = d3.scale.ordinal().rangeRoundBands([0, width], .1).domain(xMarks.map(function(d) {return d;}));
                    _this.y = d3.scale.linear().range([height, 0]).domain([_this.minData, _this.maxData]);
                }
            }
            _this.xAxis = d3.svg.axis().scale(_this.x).orient("bottom");
            _this.yAxis = d3.svg.axis().scale(_this.y).orient("left");

            var svg = _this.container.append('svg')
                .attr({
                    id : _this.options.id,
                    class : _this.type + 'Chart',
                    xmlns : "http://www.w3.org/2000/svg",
                    version : "1.1",
                    width : svgWidth,
                    height :　svgHeight,
                    viewBox : '0,0,' + svgWidth + ',' + svgHeight + '',
                    preserveAspectRatio : 'none'
                });
            var defs = svg.append('defs').attr('class','defs');

            var focus = svg.append("g").attr({'class' : 'focus','transform':'translate(' + _this.margin.left + ','+ _this.margin.top + ')'});

            var xAxis = focus.append("g").attr("class", "x axis xAxis").attr("transform", "translate(0," + _this.height + ")").call(_this.xAxis),
                yAxis = focus.append("g").attr("class", "y axis yAxis").call(_this.yAxis);

            _this.type == 'bar' && drawBar(_this);
            _this.type == 'line' && drawLine(_this);
            _this.type == 'area' && drawArea(_this);
            _this.options.baseline != null && drawBaseline(_this);

            formatAxis(_this);
            _this.options.brushOpen && brush(_this);
            (_this.type == 'line' || _this.type == 'area') && markLine(_this);
            legend(_this);

        },
        update : function(data,xMarks,legendArr,baseline){
            var _this = this;
            var type = _this.type;

            _this.data = getData(data);
            _this.maxData = getMaxData(_this.data);
            _this.minData = getMinData(_this.data);
            _this.xMarks = xMarks;

            _this.color = [];
            if(legendArr.length > 0)_this.options.legend = legendArr;

            if(type == 'area' || type == 'line'){
                _this.x.domain([0,(xMarks.length == 1) ? 1 :  xMarks.length-1]);
                _this.y .domain([_this.minData, _this.maxData]);
                if(_this.options.brushOpen){
                    _this.brushX.domain(_this.x.domain());
                    _this.brushY.domain(_this.y.domain());
                }
            }else if(type == 'bar'){
                if(_this.options.direction == 'horizontal'){
                    _this.x.domain([_this.minData, _this.maxData]);
                    _this.y.domain(xMarks.map(function(d) {return d;}));
                }else{
                    _this.x.domain(xMarks.map(function(d) {return d;}));
                    _this.y.domain([_this.minData, _this.maxData]);
                }
            }

            var svg = _this.container.select('svg');
            var defs = svg.select('.defs');
            var focus = svg.select(".focus");

            focus.select(".xAxis").call(_this.xAxis);
            focus.select(".yAxis").call(_this.yAxis);
            formatAxis(_this);

            _this.type == 'bar' && drawBar(_this);
            _this.type == 'line' && drawLine(_this);
            _this.type == 'area' && drawArea(_this);
            if(baseline){
                _this.options.baseline = baseline;
                drawBaseline(_this);
            }

            _this.options.brushOpen && brush(_this);
            (_this.type == 'line' || _this.type == 'area') && markLine(_this);
            legend(_this);

        },
        resize : function(){
            var _this = this;
            var type = _this.type;
            _this.width = _this.container[0][0].clientWidth - _this.margin.left - _this.margin.right;
            _this.height = _this.container[0][0].clientHeight - _this.margin.top - _this.margin.bottom;
            if(_this.options.brushOpen){
                _this.brushMargin.top =  _this.height + _this.margin.top + 50;
                //_this.x.domain(_this.brushExtent);
            }

            if(type == 'area' || type == 'line'){
                _this.x.range([0, _this.width]);
                _this.y.range([_this.height, 0]);
                type == 'area' && _this.area.y0(_this.height);
                _this.options.brushOpen && _this.brushX.range([0, _this.width]);
            }else if(type == 'bar'){
                if(_this.options.direction == 'horizontal'){
                    _this.x.range([0,_this.width]);
                    _this.y.rangeRoundBands([_this.height,0], .1);
                }else{
                    _this.x.rangeRoundBands([0,_this.width], .1);
                    _this.y.range([_this.height,0]);
                }
            }

            var svg = _this.container.select('svg').attr({
                width : _this.container[0][0].clientWidth,
                height :　_this.container[0][0].clientHeight,
                viewBox : '0,0,' + _this.container[0][0].clientWidth + ',' + _this.container[0][0].clientHeight + ''
            });

            var focus = svg.select(".focus");
            focus.select(".xAxis").attr("transform", "translate(0," + _this.height + ")").call(_this.xAxis);
            focus.select(".yAxis").call(_this.yAxis);
            formatAxis(_this,true);

            var isH = type == 'bar' && _this.options.direction == 'horizontal';

            if(type == 'area' || type == 'line'){
                focus.selectAll('path.polyline').attr("d", _this.line);
                type == 'area' && focus.selectAll('path.area').attr("d", _this.area);

                if(!svg.select('defs .brushClipRect').empty())svg.select('defs .brushClipRect').attr({width : _this.width, height : _this.height});
                if(!svg.select('.brushGroup').empty()){
                    var brushGroup = svg.select('.brushGroup');
                    var brush = _this.brush;
                    brushGroup.attr({width : _this.width, height : _this.height});
                    brushGroup.select('.brush').call(_this.brush);
                    _this.brushExtent && brush.extent(_this.brushExtent);
                    brushGroup.selectAll('.brushPath').attr({d : _this.brushArea});
                    brushGroup.attr({transform : "translate(" + _this.brushMargin.left + "," + _this.brushMargin.top + ")"});
                }
                if(!svg.select('.markLine').empty()){
                    var markGroup = svg.selectAll('.markLine .markGroup');
                    svg.select('#' + _this.id + 'LineClipRect rect').attr({ width : _this.width+20, height: _this.height+20});
                    markGroup.attr("transform", function(d,i){return "translate(" + _this.x(i) + ",0)";});
                    markGroup.selectAll('.lineShow').attr({y2 : _this.height});
                    if(_this.options.markPoint){
                        markGroup.selectAll('.outCircle').attr({cy:function(d) {return _this.y(d[Array.from(markGroup[0]).indexOf(this.parentNode.parentNode)]);}});
                        markGroup.selectAll('.inCircle').attr({cy : function(d) {return _this.y(d[Array.from(markGroup[0]).indexOf(this.parentNode.parentNode)]);}});
                    }
                    markGroup.selectAll('.lineRect').attr({width : function(d,i) {return Math.abs(Math.abs( _this.x(i)) - Math.abs( _this.x(i-1)));}, height : _this.height});
                }

            }else if(type == 'bar'){
                var x = isH ? _this.y : _this.x;
                var y = isH ? _this.x : _this.y;
                var xMarks = _this.xMarks;
                var maxRectWidth = _this.options.maxRectWidth;

                focus.selectAll('.barGroup').selectAll('.bar').attr({
                    height : isH ? function(){ return rectW(x.rangeBand(),_this.data.length,maxRectWidth)} : function(d) {return Math.abs(y(d) - y(0));},
                    width : isH ? function(d) {return Math.abs(y(d) - y(0));} : function(){ return rectW(x.rangeBand(),_this.data.length,maxRectWidth)},
                    x : isH ? 0 : function(d,i){return barPos(d3.select(this.parentNode).attr('data-th'), x.rangeBand(),this.getBBox().width,_this.data.length,x(xMarks[i]));} ,
                    y : isH ? function(d,i){return barPos(d3.select(this.parentNode).attr('data-th'), x.rangeBand(),this.getBBox().height,_this.data.length,x(xMarks[i]));}
                        : function(d) {return  y(Math.max(0, d));}
                });


            }

            if(!focus.select('.baseline').empty()){
                focus.select('.baseline').attr({
                    x1: isH ?  _this.x(_this.options.baseline) : 0,
                    y1: isH ? 0 : _this.y(_this.options.baseline),
                    x2: isH ? _this.x(_this.options.baseline) :_this.width,
                    y2: isH ? _this.height : _this.y(_this.options.baseline),
                });
                var baseBox = focus.select('.baselineLegend')[0][0].getBBox();
                focus.select('.baselineLegend').attr("transform", "translate(" + (_this.width-baseBox.width) + "," + (-baseBox.height) + ")");
            }

            if(!svg.select('.legendGroup').empty()){
                var legendGroup = svg.select('.legendGroup');
                var bbox = legendGroup[0][0].getBBox();
                if(_this.options.legendStyle == 'top'){
                    legendGroup.attr("transform","translate(" + ((_this.width-bbox.width)/2+_this.margin.left) +","+ (_this.margin.top-bbox.height) +")");
                }else if(_this.options.legendStyle == 'bottom'){
                    var top = !_this.options.brushOpen ? (_this.margin.top + _this.container.select('.focus')[0][0].getBBox().height)
                        : (d3.select('.resize.w')[0][0].getBBox().height + _this.brushMargin.top + 5);
                    legendGroup.attr("transform","translate(" + ((_this.width-bbox.width)/2+_this.margin.left) +","+ top +")");

                }
            }

        }
    };

    return d3Chart;

    /**
     * 折线图
     * @param _this
     */
    function drawLine(_this){
        _this.line = d3.svg.line().x(function(d,i) { return _this.x(i); }).y(function(d) { return _this.y(d); }).interpolate('linear');
        !_this.container.select('.focus path.polyline').empty() && _this.container.selectAll('.focus path.polyline').remove();
        _this.container.select('.focus')
            .selectAll('.polyline')
            .data(_this.data)
            .enter()
            .append('path')
            .attr({
                class : 'polyline',
                d : _this.line,
                'stroke-width' : 2,
                stroke : function(){ return setColor(_this.options.colorSet,_this.color);},
                fill : 'none'
            });
    }
    /**
     * 面积图
     * @param _this
     */
    function drawArea(_this){
        drawLine(_this);
        _this.area = d3.svg.area().x(function(d,i) { return _this.x(i); }).y0(_this.height).y1(function(d) { return _this.y(d); });
        !_this.container.select('.focus path.area').empty() && _this.container.selectAll('.focus path.area').remove();
        _this.container.select('.focus')
            .selectAll('.area')
            .data(_this.data)
            .enter()
            .append('path')
            .attr({
                class : 'area',
                d : _this.area,
                fill : function(d,i){return 'url(#' + linearGradient(_this.container.select('svg'),i,_this.color[i],_this.id) +')'}
            });
    }
    /**
     * 柱状图
     * @param _this
     */
    function drawBar(_this){
        var maxRectWidth = _this.options.maxRectWidth;
        var isH = _this.options.direction == 'horizontal';
        var x = isH ? _this.y : _this.x;
        var y = isH ? _this.x : _this.y;
        var xMarks = _this.xMarks;
        var focus = _this.container.select('.focus');
        !focus.select('.barGroup').empty() && focus.selectAll('.barGroup').remove();
        var barGroup = focus
            .selectAll('.barGroup')
            .data(_this.data)
            .enter()
            .append('g')
            .attr('class','barGroup')
            .attr('data-th',function(d,i){return i;})
            .attr('color',function(){return setColor(_this.options.colorSet,_this.color);})
            .selectAll('.bar')
            .data(function(d){return d;})
            .enter()
            .append('rect')
            .attr({
                class : 'bar',
                rx : 4,
                ry : 4,
                fill : function(){return d3.select(this.parentNode).attr('color')}
            });

        barGroup.attr({
            height : isH ? function(){ return rectW(x.rangeBand(),_this.data.length,maxRectWidth)} : function(d) {return Math.abs(y(d) - y(0));},
            width : isH ? function(d) {return Math.abs(y(d) - y(0));} : function(){ return rectW(x.rangeBand(),_this.data.length,maxRectWidth)},
            x : isH ? 0 : function(d,i){return barPos(d3.select(this.parentNode).attr('data-th'), x.rangeBand(),this.getBBox().width,_this.data.length,x(xMarks[i]));} ,
            y : isH ? function(d,i){return barPos(d3.select(this.parentNode).attr('data-th'), x.rangeBand(),this.getBBox().height,_this.data.length,x(xMarks[i]));}
                : function(d) {return  y(Math.max(0, d));}
        });
        if(_this.options.isHover){
            barGroup.style('cursor','pointer');
            barGroup
                .on("mousemove", function (d,i) {
                    d3.select(this).attr('fill-opacity','0.6');
                    _this.options.showTips && toolTip(_this.container, _this.margin, _this.data, _this.xMarks, _this.options.unit, _this.options.legend, i);
                })
                .on("mouseout", function (){
                    d3.select(this).attr('fill-opacity','1');
                    if(_this.options.showTips){_this.container.select('.d3ChartTips').style({display : 'none'});}
                });
        }

    }
    /**
     * bar的X坐标
     * @param xid 维度
     * @param rangeBand 自动分配的柱状大小(x.rangeBand())
     * @param barWidth
     * @param barCount
     * @param oX 原x坐标（x（mark））
     * @returns {*}
     */
    function barPos(xid,rangeBand,barWidth,barCount,oX){
        var xP = (rangeBand - barCount*barWidth)/2 + oX + xid*barWidth;
        return xP > 0 ? xP : oX;
    }
    /**
     * bar 宽度（高度）
     * @param rangeBand
     * @param count
     * @param maxRectWidth
     * @returns {*}
     */
    function rectW(rangeBand,count,maxRectWidth){
        //var barWidth = x.rangeBand()/_this.data.length;
        var barWidth = rangeBand/count;
        var w = barWidth > maxRectWidth ? maxRectWidth : barWidth;
        return w > 0 ? w : barWidth;
    }

    /**
     * 基线
     * @param _this
     */
    function drawBaseline(_this){
        var isH = _this.type == 'bar' && _this.options.direction == 'horizontal';
        var focus = _this.container.select('.focus');
        !focus.select('.baseline').empty() && focus.select('.baseline').remove();
        !focus.select('.baselineLegend').empty() && focus.select('.baselineLegend').remove();
        focus.append('line').attr({
            x1: isH ?  _this.x(_this.options.baseline) : 0,
            y1: isH ? 0 : _this.y(_this.options.baseline),
            x2: isH ? _this.x(_this.options.baseline) :_this.width,
            y2: isH ? _this.height : _this.y(_this.options.baseline),
            class: 'baseline',
            stroke: '#302cdc'});
        var baselineLegend = focus.append('g').attr('class','baselineLegend');
        baselineLegend.append('line').attr({x1:-25,x2:-5,y1: -6,y2: -6, class : 'baselineLegend', stroke: '#302cdc', 'stroke-width' : 2});
        baselineLegend.append('text').attr({class : 'baselineText', fill: '#8accd5'}).style('font-size','16px')
            .text('基线：' + _this.options.baseline.toFixed(2)*100/100 + (_this.options.unit ?  _this.options.unit : ''));
        var bbox = baselineLegend[0][0].getBBox();
        baselineLegend.attr("transform", "translate(" + (_this.width-bbox.width) + "," + (-bbox.height) + ")");
    }

    /**
     *默认配置
     * @param type
     */
    function defaultSettings(type){
        var baseOptions = {
            id : '',
            xMarks : [],
            data : [],
            legend : [],
            legendStyle : 'top',
            unit : null,
            showTips : true,
            xText : 1,
            bgColor : '#3a4b5c',
            colorSet : ['#66e690','#7bdb74','#a1d271','#82bf9a','#e0e46e','#c8ce81','#83c89a','#83c4b7','#90a7bd',
                '#6dcde3','#e66495','#d46b6a','#df8c5f','#da9779','#c4da77','#b56ed2','#a684be','#7e7cc8','#719ed5','#408bd7'],
            isHover : true,
            baseline : null
        };
        var typeOptions = {};
        if(type == 'area' || type == 'line'){
            typeOptions = {
                brushOpen : false,
                markLine : true,
                markPoint : true
            }
        }else if(type == 'bar'){
            typeOptions = {
                direction : 'vertical', // 默认竖向折线图  horizontal : 横向
                //rectPadding : 4,
                maxRectWidth : 22
            }
        }

        return Object.assign(baseOptions,typeOptions);
    }
    /**
     * 将数组转化为二维数组
     * @param data
     * @returns {*}
     */
    function getData(data){
        if(!(data[0] instanceof Array)) {
            var tempArr = [];
            tempArr.push(data);
            data = tempArr;
        }

        return data;
    }
    /**
     * 获取最大值
     * @param data
     * @returns {number}
     */
    function getMaxData(data){
        var maxVal = 0;

        for(var i=0;i<data.length;i++) {
            maxVal = d3.max([maxVal,d3.max(data[i].map(function(value){return Number(value);}))]);
        }
        var num_size = parseInt(Math.round(maxVal).toString().length);
        var first_num = Math.ceil(maxVal/Math.pow(10,num_size-1));
        return (maxVal < 100 ? Math.ceil(maxVal/100) * 100  :
                (first_num < 6 ? first_num * Math.pow(10,num_size-1) : Math.ceil(first_num/2) * 2 * Math.pow(10,num_size-1))) || 100;
    }
    /**
     * 获取最小值
     * @param data
     * @returns {number}
     */
    function getMinData(data){
        var minData = 0;
        for(var i=0;i<data.length;i++) {minData = d3.min([minData,d3.min(data[i])]);}
        return minData;
    }
    /**
     * 分割字符串
     * @param str
     * @param max
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
    /**
     * 选取随机颜色
     * @param colorSet
     * @param colorArr
     */
    function setColor(colorSet,colorArr){
        var _color = '';
        var setColorA = function(){
            _color = colorSet[((colorSet.length-1) * Math.random()).toFixed(0)];
            if(colorArr.indexOf(_color) > -1){
                setColorA();
            }else{
                colorArr.push(_color);
                return _color;
            }
        };
        return setColorA();
    }

    /**
     * 创建颜色渐变
     * @param svg
     * @param i
     * @param _color
     * @param id
     * @returns {string}
     */
    function linearGradient(svg,i,_color,id){
        var def = svg.select('.defs');
        !def.select('#' +  id + 'linearDef' + i).empty() && def.select('#' +  id + 'linearDef' + i).remove();
        var linearGradientDef = def.append('linearGradient').attr({id : id + 'linearDef' + i, x1 : '0%', y1 : '0%', x2 : '0%', y2 : '100%'});
        linearGradientDef.append('stop').attr({offset : '0%'}).style({'stop-color':_color, 'stop-opacity':0.3});
        linearGradientDef.append('stop').attr({offset : '100%'}).style({'stop-color':_color, 'stop-opacity':0});
        return  id + 'linearDef' + i;
    }
    /**
     * 创建tips(xMark /br legend : data (unit))
     * @param container
     * @param margin
     * @param data
     * @param xMarks
     * @param unit
     * @param legend
     * @param i
     */
    function toolTip(container,margin,data,xMarks,unit,legend,i){

        var tip = d3.select(container.select('.d3ChartTips')[0][0] || container.append('div').attr('class','d3ChartTips')
                .style({position: 'fixed', width: 'auto', height: 'auto', 'font-size': '14px', 'text-align': 'left','display':'none',
                    'padding': '8px 15px 8px 15px', 'background-color': '#03101b', 'opacity': '0.75', 'border-radius': '2px', 'color': '#BEE2EB'})[0][0]);
        var mouseX = d3.event.pageX - margin.left;
        var mouseY = d3.event.pageY - margin.top + 80;
        tip.html(function(){
            var html = xMarks[i] + '</br>';
            for(var k=0;k < data.length;k++){
                html += (legend[k] ? (legend[k]+ '：') : '')
                    + data[k][i]
                    + (unit ? (typeof unit == 'string' ? unit : (unit[k] ? unit[k] : '')) : '')
                    + '</br>';
            }
            return html;
        })
            .style({
                left : mouseX + 'px',
                top : mouseY + 'px',
                display : 'block'
            });
        return tip;
    }
    /**
     * 格式化坐标轴
     * @param _this
     * @param isBrush
     */
    function formatAxis(_this,isBrush){
        var isHBar = _this.type == 'bar' && _this.options.direction == 'horizontal';
        var focus =  _this.container.select('.focus');
        var xAxis = isHBar ? focus.select('.yAxis') : focus.select('.xAxis');
        var yAxis = isHBar ? focus.select('.xAxis') : focus.select('.yAxis');
        //var xAxis = focus.select('.xAxis');
        //var yAxis = focus.select('.yAxis');

        focus.selectAll('.axis line').attr({stroke : _this.options.bgColor, 'stroke-width' : '1px'});
        focus.selectAll('.axis text').attr('fill','#56676a');
        !isBrush && focus.select('.x.axis line').attr('stroke','#e8eff4');
        focus.select('.y.axis line').attr('stroke','#e8eff4');
        focus.selectAll('.axis path').remove();

        xAxis.selectAll('text').classed('yMarkText',true);
        isHBar ? xAxis.selectAll('line').attr({x2 : _this.width}) : xAxis.selectAll('line').attr({y2 : -_this.height});
        isHBar ? yAxis.selectAll('line').attr({y2 : -_this.height}) : yAxis.selectAll('line').attr({x2 : _this.width});
        _this.type == 'bar' && xAxis.selectAll('line').style('display','none');

        /**
         * 横坐标分行显示
         **/
        if(_this.options.xMarks.length > 0){
            if(_this.options.xText == 2){
                var xText = xAxis.selectAll('text').text('');
                xText.append("tspan")
                    .text(function(d){
                        var xData = _this.type == 'bar' ? d : _this.xMarks[d];
                        if(typeof xData != 'undefined')return xData.split(' ')[0];})
                    .attr({x : 0 ,dy : 10});
                xText.append("tspan")
                    .text(function(d){
                        var xData = _this.type == 'bar' ? d : _this.xMarks[d];
                        if(typeof xData != 'undefined')return xData.split(' ')[1];})
                    .attr({x : 0 ,dy : function(){return this.previousElementSibling.getBBox().height;}});

            }else{
                xAxis.selectAll('text').text(function(d){
                    var xData = _this.type == 'bar' ? d : _this.xMarks[d];
                    if(typeof xData != 'undefined')return xData;});
            }
        }

        if(xAxis.selectAll('g')[0].length > 2){
            var firstMajor = xAxis.selectAll('g')[0][1];
            var majorWidth = isHBar ? firstMajor.getBBox().height : firstMajor.getBBox().width;

            xAxis.selectAll('g').style('display','block');
            if(_this.type == 'area' || _this.type == 'line'){
                var majorX = firstMajor.transform.animVal[0].matrix.e;
                majorWidth > majorX && xAxis.selectAll('g').each(function(d,i){if(i % 2 != 0)d3.select(this).style('display','none');});
            }else if(_this.type == 'bar'){
                var bbox = focus.select('.bar')[0][0].getBBox();
                var barAllWidth = (isHBar ? bbox.height : bbox.width) * _this.data.length;
                var showLen = Math.ceil(xAxis.selectAll('g')[0].length / ((isHBar ? _this.height : _this.width) / majorWidth));
                majorWidth > barAllWidth && xAxis.selectAll('g').each(function(d,i){if(i % showLen != 0)d3.select(this).style('display','none');});
            }
        }

        d3.selectAll('.chartAxisTips').remove();
        /**
         * 为y轴显示不全的值添加tips
         */
        focus.select('.yAxis').selectAll('text').each(function(){
            var strArr = splitByLine(this.innerHTML,_this.margin.left-22,14);
            if(strArr.length > 1){
                show_msgs(d3.select(this),this.innerHTML,'right',true).classed('chartAxisTips',true);
                d3.select(this).text(strArr[0] + '...');
            }
        });



    }

    /**
     * 拖拽条
     * @param _this
     */
    function brush(_this){
        var svg = _this.container.select('svg');
        var focus = svg.select('.focus');
        var brush = d3.svg.brush().x(_this.brushX).on("brush", brushed).on("brushend", brushend);
        var brushArea = d3.svg.area().x(function(d,i) { return _this.brushX(i); }).y0(_this.brushHeight).y1(function(d) { return _this.brushY(d); });

        _this.brush = brush;
        _this.brushArea = brushArea;

        !svg.select('#' + _this.id + 'ClipRect').empty() && svg.select('#' + _this.id + 'ClipRect').remove();
        !svg.select('#' + _this.id + 'Brush').empty() && svg.select('#' + _this.id + 'Brush').remove();

        var clipPath = svg.select('.defs').append('clipPath').attr('id',_this.id + 'ClipRect').append('rect')
            .attr({class:'brushClipRect',x :0, y : 0, width : _this.width, height : _this.height});
        var context = svg.append("g").attr({
            transform : "translate(" + _this.brushMargin.left + "," + _this.brushMargin.top + ")",
            id : _this.id + 'Brush',
            class : 'brushGroup'
        });
        context.append("path").datum(_this.data[0]).attr({class : 'brushPath',d : brushArea, fill : '#284b96'});


        focus.selectAll('.polyline').attr("clip-path","url(#"+ _this.id + "ClipRect)");
        _this.type ==  'area' && focus.selectAll('.area').attr("clip-path","url(#"+ _this.id + "ClipRect)");

        var _brush = context.append("g").attr("class", "x brush").call(brush);
        _brush.selectAll("rect").attr("y", -6).attr("height", _this.brushHeight + 5);
        _brush.select('.background').style({fill : 'rgba(15, 43, 65,0.5)', visibility: 'visible'});
        _brush.selectAll('g').style({display : 'block'});
        _brush.selectAll('rect').attr({rx : 5, ry : 5});
        _brush.selectAll('.resize').select('rect').attr({fill : '#278fa3', y : -12, height : 42, width : 10});

        var wBrushText = _brush.selectAll('.resize.w').append('text').attr({y : 8, fill : '#80a2a6', class : 'brushText wBrushText'});
        var eBrushText = _brush.selectAll('.resize.e').append('text').attr({x : 12, y : 22, fill : '#80a2a6', class : 'brushText eBrushText'});
        _brush.select('.extent').attr({fill : 'rgba(27,66,90,0.5)', rx : 0, ry : 0});

        var xAxis = svg.select('.xAxis');
        var yAxis = svg.select('.yAxis');
        var xMarks = _this.xMarks;
        var brushExtent;
        function brushed() {
            var wBrushLeft = context.select('.brush .resize.w')[0][0].transform.baseVal.getItem(0).matrix.e;
            var eBrushLeft = context.select('.brush .resize.e')[0][0].transform.baseVal.getItem(0).matrix.e;
            if(wBrushLeft < eBrushLeft){
                brushExtent = brush.empty() ? x2.domain() : brush.extent();
                _this.x.domain(brushExtent);//当brush.empty(选定为空)时，x与x2的数值范围是一样的，当有brush时，x绑定brush对象刷到的区域所代表的数据范围。
                focus.selectAll(".area").attr("d", _this.area);

                var brushLine = focus.selectAll(".polyline").attr("d", _this.line);
                //polylineMove(brushLine);
                xAxis.call(_this.xAxis);
                formatAxis(_this,true);


                var brushXText = xAxis.selectAll('text').text('');
                brushXText.append("tspan").attr({dx : 0 ,dy : 10})
                    .text(function(d){return d.toString().indexOf('.')>-1 ? '' : (xMarks[d].toString().indexOf(' ') == -1 ? xMarks[d] : xMarks[d].split(' ')[0]);});
                brushXText.append("tspan").attr({dx : -65 ,dy : 14})
                    .text(function(d){return d.toString().indexOf('.')>-1 ? '' : (xMarks[d].toString().indexOf(' ') == -1 ? xMarks[d] : xMarks[d].split(' ')[1]);});

                yAxis.selectAll('line').attr({x2 : _this.width});
                var eLeft = _brush.select('.background')[0][0].getBBox().width - eBrushText[0][0].getBBox().width;
                wBrushText.text(_this.xMarks[Math.floor(brushExtent[0]).toFixed(0)])
                    .attr({x : wBrushLeft < wBrushText[0][0].getBBox().width ? 12 : -wBrushText[0][0].getBBox().width-10});
                eBrushText.text(_this.xMarks[Math.floor(brushExtent[1]).toFixed(0)])
                    .attr({x : eBrushLeft > eLeft ?  -wBrushText[0][0].getBBox().width-10 : 12});

                _this.brushExtent = brushExtent;
            }

        }
        function brushend(){
            _brush.selectAll('rect').style({visibility: 'visible'});
            _brush.selectAll('g').style({display : 'block'});
            markLine(_this);
        }
    }
    /**
     * hover效果相关
     * @param _this
     */
    function markLine(_this){
        var focus = _this.container.select('.focus');
        var defs = _this.container.select('defs') || _this.container.select('svg').append('defs');

        !focus.select('.markLine').empty() && focus.select('.markLine').remove();
        !_this.container.select('#' + _this.id + 'LineClipRect').empty() && _this.container.select('#' + _this.id + 'LineClipRect').remove();

        var markClip = defs.append('clipPath').attr('id',_this.id + 'LineClipRect')
            .append('rect').attr({class : 'markClip', x :-10, y : -10, width : _this.width+20, height: _this.height+20});

        var markGroup = focus.append('g').attr('class','markLine')
            .attr("clip-path", _this.options.brushOpen ? "url(#"+ _this.id + "LineClipRect)" : '')
            .selectAll('g').data(_this.data[0]).enter()
            .append('g').attr({class: 'markGroup', transform: function(d,i){return 'translate(' + _this.x(i) + ',0)'}})
            .style({cursor : 'pointer'});

        markGroup.append('line')
            .attr({
                class : 'lineShow',
                'stroke-width' : 2,
                stroke : '#3a4b5c',
                fill : 'none',
                x1 : 0,
                y1 : 0,
                x2 : 0,
                y2 : _this.height
            })
            .style({opacity : 0});
        markGroup.append('rect')
            .attr({
                class : 'lineRect',
                x : 0,
                width : function(d,i) {return Math.abs(Math.abs(_this.x(i)) - Math.abs(_this.x(i-1)));},
                fill:'transparent',
                height : _this.height
            });

        if(_this.options.markPoint){
            var markCircle = markGroup.selectAll('.markCircle').data(_this.data).enter().append('g').attr('class','markCircle')
                .style({opacity : _this.options.isHover ? 0 : 1});
            markCircle.append("circle")
                .attr({
                    cx : 0,
                    cy : function(d) {return _this.y(d[Array.from(markGroup[0]).indexOf(this.parentNode.parentNode)]);},
                    r : 10,
                    fill : function(d,i){return  _this.color[i];},
                    stroke : function(d,i){return  _this.color[i];},
                    'fill-opacity' : 0.2,
                    class : 'outCircle'
                });
            markCircle.append("circle")
                .attr({
                    cx : 0,
                    cy : function(d) {return _this.y(d[Array.from(markGroup[0]).indexOf(this.parentNode.parentNode)]);},
                    r : 3,
                    fill : function(d,i){return  _this.color[i];},
                    stroke : 'none',
                    class : 'inCircle'
                });
        }

        if(_this.options.isHover){
            markGroup
                .on('mousemove', function(d,i){
                    _this.options.showTips && toolTip(_this.container, _this.margin, _this.data, _this.xMarks, _this.options.unit, _this.options.legend, i);
                    _this.options.markLine && d3.select(this).select('line').style({opacity : 1});
                    _this.options.markPoint && d3.select(this).selectAll('.markCircle').style({opacity : 1});
                })
                .on('mouseout', function(){
                    if(_this.options.showTips){_this.container.select('.d3ChartTips').style({display : 'none'});}
                    _this.options.markLine && d3.select(this).select('line').style({opacity : 0});
                    _this.options.markPoint && d3.select(this).selectAll('.markCircle').style({opacity : 0});
                });

        }
    }
    /**
     * 图例
     * @param _this
     */
    function legend(_this){
        var legendArr = _this.options.legend;
        !_this.container.select('svg .legendGroup').empty() && _this.container.selectAll('svg .legendGroup').remove();
        if(legendArr.length > 0){
            var legendGroup = _this.container.select('svg').append("g").attr('class','legendGroup');
            var legendG = legendGroup.selectAll('legend')
                .data(legendArr)
                .enter()
                .append("g")
                .attr('class','legend');
            legendG.append("rect").attr({width:10,height:10,x : 0, y : -10, fill : function(d,i){return _this.color[i]}});
            legendG.append("text").text(function(d){return d;})
                .attr({x : 12, y : 0, fill : function(d,i){return _this.color[i]}});

            legendG.each(function(d,i){
                if(i != 0){
                    var width = legendG[0][i-1].getBBox().width;
                    d3.select(legendG[0][i]).attr("transform","translate("+ (1.5*width) + "," + 0 +")");
                }
            });

            var bbox = legendGroup[0][0].getBBox();
            if(_this.options.legendStyle == 'top'){
                legendGroup.attr("transform","translate(" + ((_this.width-bbox.width)/2+_this.margin.left) +","+ (_this.margin.top-bbox.height) +")");
            }else if(_this.options.legendStyle == 'bottom'){
                var top = !_this.options.brushOpen ? (_this.margin.top + _this.container.select('.focus')[0][0].getBBox().height)
                    : (d3.select('.resize.w')[0][0].getBBox().height + _this.brushMargin.top + 5);
                legendGroup.attr("transform","translate(" + ((_this.width-bbox.width)/2+_this.margin.left) +","+ top +")");

            }


        }
    }
})();
