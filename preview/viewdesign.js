$().ready( function() {
	$(".viewDesignIcon").click(function() {
		var productId = $(this).attr("productId");
		var content = '<div style="width: 400px; height:460px;"><iframe src="/designer/preview/build.html?productId='+productId+'" width="400px" height="460px" style="border: 0 none; overflow: hidden;"></iframe></div>';
		var a = $.dialog({title: "View product", content: content, width: 400, height: 540, position:"center", cancel: "close", modal: false, className: "dialog-preview"});
		$("#"+ a).css({"top": 30}).find(".dialogContent").css({"margin": 0});
	});
});