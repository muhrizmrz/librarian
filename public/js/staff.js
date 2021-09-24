$(document).ready(function(){

    $('#userDropdown').click(function(){
        $('#logoutDropdown').fadeToggle('fast')
    })
 
/*    //// CIRCULATION //////////////////////// */
    
    $('#checkout').click(function(){
        console.log("hi")
        $('#checkoutForm').show()
    })
    $('#checkin').click(function(){
        $('#checkinForm').hide()
    })


})