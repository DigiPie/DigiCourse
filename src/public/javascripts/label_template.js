'use strict';

// BODY ELEMENTS
var TemplateSidebar = $('.sidebar');
var MobileToggler = $(".t-header-mobile-toggler");

// SIDEBAR TOGGLE FUNCTION FOR MOBILE (SCREEN "MD" AND DOWN)
MobileToggler.on("click", function () {
  console.log("hello");
  $(".page-body").toggleClass("sidebar-collpased");
});