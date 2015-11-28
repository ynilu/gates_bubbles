var BubbleChart, root,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

BubbleChart = (function() {
  function BubbleChart(data) {
    this.hide_details = bind(this.hide_details, this);
    this.show_details = bind(this.show_details, this);
    this.hide_years = bind(this.hide_years, this);
    this.display_years = bind(this.display_years, this);
    this.move_towards_year = bind(this.move_towards_year, this);
    this.display_by_year = bind(this.display_by_year, this);
    this.move_towards_center = bind(this.move_towards_center, this);
    this.display_group_all = bind(this.display_group_all, this);
    this.start = bind(this.start, this);
    this.create_vis = bind(this.create_vis, this);
    this.create_nodes = bind(this.create_nodes, this);
    var h_over_n, item, j, l, list, max_amount, results, results1;
    this.data = data;
    this.width = 940;
    this.height = 600;
    this.tooltip = CustomTooltip("gates_tooltip", 240);
    h_over_n = (this.height - 200) / 24;
    list = (function() {
      results = [];
      for (j = 1; j <= 24; j++){ results.push(j); }
      return results;
    }).apply(this);
    this.year_center_y = (function() {
      var l, len, results1;
      results1 = [];
      for (l = 0, len = list.length; l < len; l++) {
        item = list[l];
        results1.push(item * h_over_n + 100);
      }
      return results1;
    })();
    this.center = {
      x: this.width / 2,
      y: this.height / 2
    };
    this.year_centers = {
      "2004": {
        x: this.width + 200,
        y: 0
      },
      "2005": {
        x: this.width + 200,
        y: 0
      },
      "2006": {
        x: this.width + 200,
        y: 0
      },
      "2007": {
        x: this.width + 200,
        y: 0
      },
      "2008": {
        x: -200,
        y: this.height / 2
      },
      "2009": {
        x: -200,
        y: this.height + 200
      },
      "2010": {
        x: -200,
        y: this.height + 200
      },
      "2011": {
        x: -200,
        y: this.height + 200
      },
      "2012": {
        x: 180,
        y: this.height / 2
      },
      "2013": {
        x: this.width / 2,
        y: this.height / 2
      },
      "2014": {
        x: this.width - 180,
        y: this.height / 2
      }
    };
    this.layout_gravity = -0.01;
    this.damper = 0.1;
    this.vis = null;
    this.nodes = [];
    this.force = null;
    this.circles = null;
    this.fill_color = d3.scale.ordinal().domain((function() {
      results1 = [];
      for (l = 0; l <= 24; l++){ results1.push(l); }
      return results1;
    }).apply(this)).range(["#d84b2a", "#ee9586", "#e4b7b2", "#aaaaaa", "#beccae", "#9caf84", "#7aa25c"]);
    max_amount = d3.max(this.data, function(d) {
      return parseInt(d["總計_Grand Total"]);
    });
    this.radius_scale = d3.scale.pow().exponent(0.4).domain([0, max_amount]).range([2, 40]);
    this.create_nodes();
    this.create_vis();
  }

  BubbleChart.prototype.create_nodes = function() {
    var i;
    i = 0;
    this.data.forEach((function(_this) {
      return function(d) {
        var k, node, results, v;
        results = [];
        for (k in d) {
          v = d[k];
          if (k === "年度別Fiscal Year") {
            continue;
          }
          if (k === "總計_Grand Total") {
            continue;
          }
          node = {
            id: i,
            radius: _this.radius_scale(parseInt(v)),
            value: v,
            name: k,
            year: d["年度別Fiscal Year"],
            x: Math.random() * 900,
            y: Math.random() * 800
          };
          i = i + 1;
          results.push(_this.nodes.push(node));
        }
        return results;
      };
    })(this));
    return this.nodes.sort(function(a, b) {
      return b.value - a.value;
    });
  };

  BubbleChart.prototype.create_vis = function() {
    var that;
    this.vis = d3.select("#vis").append("svg").attr("width", this.width).attr("height", this.height).attr("id", "svg_vis");
    this.circles = this.vis.selectAll("circle").data(this.nodes, function(d) {
      return d.id;
    });
    that = this;
    this.circles.enter().append("circle").attr("r", 0).attr("fill", (function(_this) {
      return function(d) {
        return _this.fill_color(parseInt(d.id) % 24);
      };
    })(this)).attr("stroke-width", 2).attr("stroke", (function(_this) {
      return function(d) {
        return d3.rgb(_this.fill_color(parseInt(d.id) % 24)).darker();
      };
    })(this)).attr("id", function(d) {
      return "bubble_" + d.id;
    }).on("mouseover", function(d, i) {
      return that.show_details(d, i, this);
    }).on("mouseout", function(d, i) {
      return that.hide_details(d, i, this);
    });
    return this.circles.transition().duration(2000).attr("r", function(d) {
      return d.radius;
    });
  };

  BubbleChart.prototype.charge = function(d) {
    return -Math.pow(d.radius, 2.0) / 8;
  };

  BubbleChart.prototype.start = function() {
    return this.force = d3.layout.force().nodes(this.nodes).size([this.width, this.height]);
  };

  BubbleChart.prototype.display_group_all = function() {
    this.force.gravity(this.layout_gravity).charge(this.charge).friction(0.9).on("tick", (function(_this) {
      return function(e) {
        return _this.circles.each(_this.move_towards_center(e.alpha)).attr("cx", function(d) {
          return d.x;
        }).attr("cy", function(d) {
          return d.y;
        });
      };
    })(this));
    this.force.start();
    return this.hide_years();
  };

  BubbleChart.prototype.move_towards_center = function(alpha) {
    return (function(_this) {
      return function(d) {
        d.x = d.x + (_this.center.x - d.x) * (_this.damper + 0.02) * alpha;
        return d.y = d.y + (_this.center.y - d.y) * (_this.damper + 0.02) * alpha;
      };
    })(this);
  };

  BubbleChart.prototype.display_by_year = function() {
    this.force.gravity(this.layout_gravity).charge(this.charge).friction(0.9).on("tick", (function(_this) {
      return function(e) {
        return _this.circles.each(_this.move_towards_year(e.alpha)).attr("cx", function(d) {
          return d.x;
        }).attr("cy", function(d) {
          return d.y;
        });
      };
    })(this));
    this.force.start();
    return this.display_years();
  };

  BubbleChart.prototype.move_towards_year = function(alpha) {
    return (function(_this) {
      return function(d) {
        var target, type, which_year, y;
        which_year = (d.year.split("Y"))[1];
        target = _this.year_centers[which_year];
        type = parseInt(d.id) % 24;
        d.x = d.x + (target.x - d.x) * (_this.damper + 0.02) * alpha * 1.1;
        if (which_year === "2012" || which_year === "2013" || which_year === "2014") {
          y = _this.year_center_y[type];
        } else {
          y = Math.random() * _this.height;
        }
        return d.y = d.y + (y - d.y) * (_this.damper + 0.02) * alpha * 1.1;
      };
    })(this);
  };

  BubbleChart.prototype.display_years = function() {
    var years, years_data, years_x;
    years_x = {
      "2012": 160,
      "2013": this.width / 2,
      "2014": this.width - 160
    };
    years_data = d3.keys(years_x);
    years = this.vis.selectAll(".years").data(years_data);
    return years.enter().append("text").attr("class", "years").attr("x", (function(_this) {
      return function(d) {
        return years_x[d];
      };
    })(this)).attr("y", 40).attr("text-anchor", "middle").text(function(d) {
      return d;
    });
  };

  BubbleChart.prototype.hide_years = function() {
    var years;
    this.circles.transition().duration(2000).attr("r", function(d) {
      return d.radius;
    });
    return years = this.vis.selectAll(".years").remove();
  };

  BubbleChart.prototype.show_details = function(data, i, element) {
    var content;
    d3.select(element).attr("stroke", "black");
    content = "<span class=\"name\">Title:</span><span class=\"value\"> " + data.name + "</span><br/>";
    content += "<span class=\"name\">Amount:</span><span class=\"value\"> $" + (addCommas(data.value)) + "</span><br/>";
    content += "<span class=\"name\">Year:</span><span class=\"value\"> " + data.year + "</span>";
    return this.tooltip.showTooltip(content, d3.event);
  };

  BubbleChart.prototype.hide_details = function(data, i, element) {
    d3.select(element).attr("stroke", (function(_this) {
      return function(d) {
        return d3.rgb(_this.fill_color(d.group)).darker();
      };
    })(this));
    return this.tooltip.hideTooltip();
  };

  return BubbleChart;

})();

root = typeof exports !== "undefined" && exports !== null ? exports : this;

$(function() {
  var chart, render_vis;
  chart = null;
  render_vis = function(csv) {
    chart = new BubbleChart(csv);
    chart.start();
    return root.display_all();
  };
  root.display_all = (function(_this) {
    return function() {
      return chart.display_group_all();
    };
  })(this);
  root.display_year = (function(_this) {
    return function() {
      return chart.display_by_year();
    };
  })(this);
  root.toggle_view = (function(_this) {
    return function(view_type) {
      if (view_type === 'year') {
        return root.display_year();
      } else {
        return root.display_all();
      }
    };
  })(this);
  return d3.csv("data/test2.csv", render_vis);
});