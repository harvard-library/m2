(function($) {

  $.Hud = function(options) {

    jQuery.extend(this, {
      element:   null,
      parent:    null,
      windowId:  null,
      annoState: null
    }, options);

    this.init();
  };

  $.Hud.prototype = {

    init: function() {   
      this.createStateMachine();
     
      this.element = jQuery(this.template({
        showNextPrev : this.parent.imagesList.length !== 1, 
        showBottomPanel : typeof this.bottomPanelAvailable === 'undefined' ? true : this.bottomPanelAvailable
      })).appendTo(this.element);
      this.contextControls = new $.ContextControls({
        element: null,
        container: this.parent.element,
        mode: 'displayAnnotations',
        parent: this,
        windowId: this.windowId
      });

      this.bindEvents();

      if (typeof this.bottomPanelAvailable !== 'undefined' && !this.bottomPanelAvailable) {
        this.parent.parent.bottomPanelVisibility(false);
      } else {
        this.parent.parent.bottomPanelVisibility(this.parent.parent.bottomPanelVisible);
      }
      
      //by default, minimized bottom panel if there is only one image for this object
      if (this.parent.imagesList.length === 1) {
        this.parent.parent.bottomPanelVisibility(false);      
      }
    },

    bindEvents: function() {
      var _this = this;

      this.parent.element.find('.mirador-osd-next').on('click', function() {
        _this.parent.next();
      });

      this.parent.element.find('.mirador-osd-previous').on('click', function() {
        _this.parent.previous();
      });

      this.parent.element.find('.mirador-osd-annotations-layer').on('click', function() {
        if (_this.annoState.current === 'annoOff') {
          _this.annoState.displayOn(this);
        } else {
          _this.annoState.displayOff(this);          
        }
      });

      this.parent.element.find('.mirador-osd-go-home').on('click', function() {
        _this.parent.osd.viewport.goHome();
      });

      this.parent.element.find('.mirador-osd-up').on('click', function() {
        var osd = _this.parent.osd;
        osd.viewport.panBy(new OpenSeadragon.Point(0, -0.05));
        osd.viewport.applyConstraints();
      });
      this.parent.element.find('.mirador-osd-right').on('click', function() {
        var osd = _this.parent.osd;
        osd.viewport.panBy(new OpenSeadragon.Point(0.05, 0));
        osd.viewport.applyConstraints();
      });
      this.parent.element.find('.mirador-osd-down').on('click', function() {
        var osd = _this.parent.osd;
        osd.viewport.panBy(new OpenSeadragon.Point(0, 0.05));
        osd.viewport.applyConstraints();
      });
      this.parent.element.find('.mirador-osd-left').on('click', function() {
        var osd = _this.parent.osd;
        osd.viewport.panBy(new OpenSeadragon.Point(-0.05, 0));
        osd.viewport.applyConstraints();
      });
      this.parent.element.find('.mirador-osd-zoom-in').on('click', function() {
        var osd = _this.parent.osd;
        if ( osd.viewport ) {
          osd.viewport.zoomBy(
            osd.zoomPerClick / 1.0
          );
          osd.viewport.applyConstraints();
        }
      });
      this.parent.element.find('.mirador-osd-zoom-out').on('click', function() {
        var osd = _this.parent.osd;
        if ( osd.viewport ) {
          osd.viewport.zoomBy(
            1.0 / osd.zoomPerClick
          );
          osd.viewport.applyConstraints();
        }
      });

      this.parent.element.find('.mirador-osd-fullscreen').on('click', function() {
        if (OpenSeadragon.isFullScreen()) {
          OpenSeadragon.exitFullScreen();
        } else {
          OpenSeadragon.requestFullScreen(_this.parent.element[0]);
        }
      });

      jQuery(document).on("webkitfullscreenchange mozfullscreenchange fullscreenchange", function() {
        _this.fullScreen();
      });

      this.parent.element.find('.mirador-osd-toggle-bottom-panel').on('click', function() {
        var visible = !_this.parent.parent.bottomPanelVisible;
        _this.parent.parent.bottomPanelVisibility(visible);
      });

      jQuery.subscribe('bottomPanelSet.' + _this.windowId, function(event, visible) {
        var dodgers = _this.parent.element.find('.mirador-osd-toggle-bottom-panel, .mirador-pan-zoom-controls, .mirador-osd-annotations-layer');
        var arrows = _this.parent.element.find('.mirador-osd-next, .mirador-osd-previous');
        if (visible === true) {
          dodgers.css({transform: 'translateY(-130px)'});
          arrows.css({transform: 'translateY(-65px)'});
        } else {
          dodgers.css({transform: 'translateY(0)'});
          arrows.css({transform: 'translateY(0)'});
        }
      });
    },
    
    createStateMachine: function() {
      //add more to these as AnnoState becomes more complex
      var _this = this;
      this.annoState = StateMachine.create({
        initial: 'annoOff',
        events: [
          { name: 'displayOn',  from: 'annoOff',  to: 'annoOnEditOff' },
          { name: 'editOn', from: 'annoOnEditOff', to: 'annoOnEditOn' },
          { name: 'editOff',  from: 'annoOnEditOn',    to: 'annoOnEditOff' },
          { name: 'displayOff', from: ['annoOnEditOn','annoOnEditOff'], to: 'annoOff' }
        ],
        callbacks: {
          ondisplayOn: function(event, from, to) { 
            _this.parent.element.find('.mirador-osd-annotations-layer').addClass("selected");
            _this.contextControls.show();
            jQuery.publish('modeChange.' + _this.windowId, 'displayAnnotations');
          },
          oneditOn: function(event, from, to) { 
            _this.parent.element.find('.mirador-osd-edit-mode').addClass("selected");
            jQuery.publish('modeChange.' + _this.windowId, 'editingAnnotations');
            _this.contextControls.rectTool.enterEditMode();
          },
          oneditOff: function(event, from, to) { 
            _this.parent.element.find('.mirador-osd-edit-mode').removeClass("selected");
            jQuery.publish('modeChange.' + _this.windowId, 'displayAnnotations');
            _this.contextControls.rectTool.exitEditMode();
          },
          ondisplayOff: function(event, from, to) { 
            if (_this.contextControls.rectTool) {
              _this.contextControls.rectTool.exitEditMode();
            }
            _this.parent.element.find('.mirador-osd-edit-mode').removeClass("selected");
            _this.parent.element.find('.mirador-osd-annotations-layer').removeClass("selected");
            _this.contextControls.hide();
            jQuery.publish('modeChange.' + _this.windowId, 'default');            
          }
        }
        });
    },

    fullScreen: function() {
      var replacementButton,
      bottomPanelHeight = this.parent.parent.element.find('.bottomPanel').innerHeight();

      if (!OpenSeadragon.isFullScreen()) {

        replacementButton = jQuery('<i class="fa fa-expand"></i>');
        this.parent.element.find('.mirador-osd-fullscreen').empty().append(replacementButton);
        this.parent.element.find('.mirador-osd-toggle-bottom-panel').show();
        this.parent.parent.bottomPanelVisibility(true);

      } else {

        replacementButton = jQuery('<i class="fa fa-compress"></i>');
        this.parent.element.find('.mirador-osd-fullscreen').empty().append(replacementButton);
        this.parent.element.find('.mirador-osd-toggle-bottom-panel').hide();
        this.parent.parent.bottomPanelVisibility(false);

      }
    },

    template: Handlebars.compile([
                                 '{{#if showNextPrev}}',
                                 '<a class="mirador-osd-previous hud-control ">',
                                 '<i class="fa fa-3x fa-chevron-left "></i>',
                                 '</a>',
                                 '{{/if}}',
                                 '<a class="mirador-osd-fullscreen hud-control">',
                                 '<i class="fa fa-expand"></i>',
                                 '</a>',
                                 '<a class="mirador-osd-annotations-layer hud-control ">',
                                 '<i class="fa fa-2x fa-comments"></i>',
                                 '</a>',
                                 '{{#if showNextPrev}}',
                                 '<a class="mirador-osd-next hud-control ">',
                                 '<i class="fa fa-3x fa-chevron-right"></i>',
                                 '</a>',
                                 '{{/if}}',
                                 '{{#if showBottomPanel}}',
                                 '<a class="mirador-osd-toggle-bottom-panel hud-control ">',
                                 '<i class="fa fa-2x fa-ellipsis-h"></i>',
                                 '</a>',
                                 '{{/if}}',
                                 '<div class="mirador-pan-zoom-controls hud-control ">',
                                 '<a class="mirador-osd-up hud-control">',
                                 '<i class="fa fa-chevron-circle-up"></i>',
                                 '</a>',
                                 '<a class="mirador-osd-right hud-control">',
                                 '<i class="fa fa-chevron-circle-right"></i>',
                                 '</a>',
                                 '<a class="mirador-osd-down hud-control">',
                                 '<i class="fa fa-chevron-circle-down"></i>',
                                 '</a>',
                                 '<a class="mirador-osd-left hud-control">',
                                 '<i class="fa fa-chevron-circle-left"></i>',
                                 '</a>',
                                 '<a class="mirador-osd-zoom-in hud-control">',
                                 '<i class="fa fa-plus-circle"></i>',
                                 '</a>',
                                 '<a class="mirador-osd-zoom-out hud-control">',
                                 '<i class="fa fa-minus-circle"></i>',
                                 '</a>',
                                 '<a class="mirador-osd-go-home hud-control">',
                                 '<i class="fa fa-home"></i>',
                                 '</a>',
                                 '</div>'
    ].join(''))

  };

}(Mirador));
