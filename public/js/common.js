(function (win,doc) {
    function onreload() {
        var html = doc.documentElement;
        var owidth = html.clientWidth;
        html.style.fontSize = (owidth / 10) + 'px';
        console.log(owidth);
    }
    if(document.readyState === "complete")
    {
        onreload();
    }
    else{
        document.addEventListener("DOMContentLoaded",onreload,false);
    }
    win.addEventListener('resize',onreload,false);


})(window,document)