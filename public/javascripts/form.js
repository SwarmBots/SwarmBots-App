$(function(){
	$('#commandForm').on('submit', function (){
		$.post('/submit', $('#commandForm').serialize(), function (data){
			$('#bots').html(data);
		});
	});
});