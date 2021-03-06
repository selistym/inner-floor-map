// create an SVG
var maxZoom, minZoom;
var svg;
w = 1505;
h = 1498;
let tiplocked = false;
var scale = 1.0;

let cur_level = 1;
let level_names = ["ARRIVAL", "DEPARTURE"];
let level_info = [];
let cur_floor_name = "ARRIVAL";

// Create function to apply zoom to countriesGroup
function zoomed() {
  t = d3.event.transform;
  levelGroup
    .attr("transform", t);
}

// Define map zoom behaviour
var zoom = d3
  .zoom()
  .scaleExtent([1, 32])
  .translateExtent([[0, 0], [w, h]])
  .extent([[0, 0], [w, h]])
  .on("zoom", zoomed);

// on window resize
$(window).resize(function () {
  // Resize SVG
  svg
    .attr("width", $("#map-holder").width())
    .attr("height", $("#map-holder").height());
  zoom.scaleTo(svg.transition(), 1);
});

function getTransform(node, xScale) {
  bbox = node.node().getBBox();
  var bx = bbox.x;
  var by = bbox.y;
  var bw = bbox.width;
  var bh = bbox.height;
  var tx = -bx * xScale + vx + vw / 2 - bw * xScale / 2;
  var ty = -by * xScale + vy + vh / 2 - bh * xScale / 2;
  return { translate: [tx, ty], scale: xScale }
}

//handler for zoom home/in/out
$('#zoom-home').on('click', function () {
  zoom.scaleTo(svg.transition(), 1);
});
$('#zoom-in').on('click', function () {
  zoom.scaleBy(svg.transition(), 1.2);
});
$('#zoom-out').on('click', function () {
  zoom.scaleBy(svg.transition(), 0.8);
});

//setting for select
$(document).ready(function () {
  load_floor_info();
  $('div#select-floor a.dropdown-item').on("click", function (e) {
    cur_floor_name = $(e.target).text();
    load_floor_info();
  });

  //floor spinner
  $('.dropdown-menu a.dropdown-item').on("click", function (e) {
    $('.dropdown-menu > a').removeClass('active');
    $(event.target).addClass('active');
    $('#btnDropDown').html($(event.target).text());

    for (i = 0; i < level_names.length; i++) {
      if (level_names[i] == $(event.target).text()) {
        cur_level = i + 1;
        break;
      }
    }
  });

  $('#up-floor').on('click', function () {
    if (cur_level < level_names.length) {
      cur_level++;
      $('.dropdown-menu > a').removeClass('active');
      $('.dropdown-menu a:nth-child(' + cur_level + ')').addClass('active');
      let cur_text = $('.dropdown-menu a:nth-child(' + cur_level + ')').text();
      $('#btnDropDown').html(cur_text);
      cur_floor_name = level_names[cur_level - 1];
      load_floor_info();
    }
  })
  $('#down-floor').on('click', function () {
    if (cur_level > 1) {
      cur_level--;
      $('.dropdown-menu > a').removeClass('active');
      $(".dropdown-menu a:nth-child(" + cur_level + ")").addClass("active");
      let cur_text = $('.dropdown-menu a:nth-child(' + cur_level + ')').text();
      $('#btnDropDown').html(cur_text);
      cur_floor_name = level_names[cur_level - 1];
      load_floor_info();
    }
  })
});

//key event
$('#search-input-text').keyup(function () {
  var filter, txtValue;
  filter = $(this).val().toUpperCase();
  list = $('#list-buildings');
  $("#list-buildings > a").each(function () {
    txtValue = $(this).text() || $(this).text().filter(":contains('More')");
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      $(this).css("display", "");
    } else {
      $(this).css("display", "none");
    }
  });
});

//load floor info
function load_floor_info() {

  //load level info
  jQuery.ajax({
    dataType: "json",
    url: "mapinfo/" + cur_floor_name + ".json",
    async: false,
    success: function (data) {
      level_info = data;
      ajax_ret = true;
    },
    error: function (err) {
      console.log(err);
    }
  });
  //floor buildings
  let str_buildings = '';
  for (i = 0; i < level_info.length; i++) {
    str_buildings += `<a class="list-group-item list-group-item-action" id="list-` + level_info[i].layer_name + `" data-toggle="list" role="tab">` + level_info[i].display_name + `</a>`;
  }
  $('#list-buildings').html(str_buildings);
  $('div#list-buildings a.list-group-item').on("click", function (e) {
    let building = level_info.filter(li => li.display_name == $(event.target).text())[0];
    let node = d3.select("g#" + building.layer_name);
    var transform = getTransform(node, 10);
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(transform.translate[0], transform.translate[1]).scale(transform.scale))
    scale = transform.scale;
  });

  var tool_tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-8, 0])
    .html(function (d) {
      // console.log(d.image);
      strInner = `<img src='` + d.image + `'>` 
        + `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;` + d.display_name + `<br>` + `<br>`
        + `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;` + d.description + `<br><br>`
        + `<div class='button-view-detail'><a href='` + d.node_url + `'>&nbsp;View&nbsp;Details&nbsp;</a></div>`;
      return strInner;

    });

  d3.xml("mapinfo/" + cur_floor_name + ".svg").mimeType("image/svg+xml").get(function (error, xml) {
    if (error) throw error;

    var importedNode = document.importNode(xml.documentElement, true);

    $("#map-holder").empty();

    d3
      .select("#map-holder")
      .each(function () {
        this.appendChild(importedNode);
      });

    svg = d3.select("svg")
      .attr("width", $("#map-holder").width())
      .attr("height", $("#map-holder").height())
      .call(zoom);


    levelGroup = d3.select("g#level");

    bbox = levelGroup.node().getBBox();
    vx = bbox.x;		// container x co-ordinate
    vy = bbox.y;		// container y co-ordinate
    vw = bbox.width;	// container width
    vh = bbox.height;	// container height
    defaultView = "" + vx + " " + vy + " " + vw + " " + vh;

    svg
      .attr("viewBox", defaultView)
      .attr("preserveAspectRatio", "xMidYMid meet")

    level_info.some(function (building, i) {

      svg
        .select("g#" + building.layer_name)
        .call(tool_tip)
        .on('mouseover', function () {
          d3.select(this)
            .style('cursor', 'pointer')
            .style('fill-opacity', 0.5);
          tool_tip.show(building);
        })
        .on('mouseout', function () {          
          d3.select(this)
            .style('fill-opacity', 1);
          if(tiplocked != true)
            tool_tip.hide();
        })
        .on('click', function () {
          tool_tip.hide();
          tiplocked = true;
          tool_tip.show(building);
          if (d3.event.defaultPrevented) {
            return; // panning, not clicking
          }
          node = d3.select(this);
          var transform = getTransform(node, 32);
          svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(transform.translate[0], transform.translate[1]).scale(transform.scale))
          scale = transform.scale;
          $('div#list-buildings > a').removeClass('active');
          $('div#list-buildings a:nth-child(' + (i + 1) + ')').addClass('active');
        });
    });
  });
}