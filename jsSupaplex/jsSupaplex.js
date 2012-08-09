//! jsSupaplex - Supaplex JavaScript port
//! Copyright (C) 2011-2012 Frigolit.net - http://frigolit.net
//! Licensed under the MIT license - See LICENSE for more information

(function($) {
	var g_img_loader = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABuUlEQVR42qXNT0iTcRzH8e+eZ3cPHYKILt29ROA1ulR0CGSJYX/MjA7RKfBQpBClrq1NmEyMTKPaSoQmRLkVLRdNgg5lRkZWYijJQA2TwWCfnjeUJ3kweuDF4Pf7vH8zSf/FTroxT/yM51qovf30ZrClobVmN4bo9L2f4qvKHx9bGlo74UYRmxwsqVKtqlyp+GLDlobWjrsR9LwdWNQvb7C8tuaLDVsaWjvmhpF40z+vpXJZCysrvtiwpaG1JqcTydfJOf3w/uFrqeSLDVsaWjviXEF/MfFNX2aW9X111RcbtjS01uhcxs1C/LOynZObwpaG1hqcDgzmo9PqPnxbXaGhDXEHTPTOiobWQs4l3HnaPaVI410VixMaHy9gHWfcPWgrKNaU1sueGdHQWr1zAemxq+8UP3pfuVxeF/f3CqOjjwXOuOOB5KmHenH9k2ho7ZDThpFc13slmkeUyWTFL9LpDNbPeODW2Sd6HvkoGlrbEthudYH6PQcC57Id+24sDQ+Pqa81I6RSj4S/ZzyQOp/Xs/AHsafl2+Gp3Wm7W/Za66tgMBjeCHcAdtnBgT+t1Xi2erb9Cxra3+s4aw3DucyWAAAAAElFTkSuQmCC";
	
	var requestAnimFrame = (function() { return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback, element) { window.setTimeout(callback, 1000 / 60); }; })();
	
	var methods = {
		init: function(options) {
			var opts = {
				"resPath":          "jsSupaplex/supaplex/",
				"useBrowserCursor": true,	// Change to false based on what browser is running
				"enableMusic":      true,
				"enableSound":      true,
				"onInitError":      function(e) { },
				"onLoadStart":      function() { },
				"onReady":          function() { }
			};
			
			$.extend(opts, options);
			
			this.each(function() {
				new (function(ui_base) {
					ui_base.data("jsSupaplex", this);
					
					var res = {
						"back":     { "filename": "back.png", "type": "gfx" },
						"chars6":   { "filename": "chars6.png", "type": "gfx" },
						"controls": { "filename": "controls.png", "type": "gfx" },
						"fixed":    { "filename": "fixed.png", "type": "gfx" },
						"extra":    { "filename": "extra.png", "type": "gfx" },
						"gfx":      { "filename": "gfx.png", "type": "gfx" },
						"menu":     { "filename": "menu.png", "type": "gfx" },
						"moving":   { "filename": "moving.png", "type": "gfx" },
						"panel":    { "filename": "panel.png", "type": "gfx" },
						"title":    { "filename": "title.png", "type": "gfx" },
						"title1":   { "filename": "title1.png", "type": "gfx" },
						"title2":   { "filename": "title2.png", "type": "gfx" },
						"levels":   { "filename": "levels.dat", "type": "data" },
						"tiledata": { "filename": "tiledata.txt", "type": "data" }
					};
					
					var capabilities = { };
					
					var audio_format;
					
					var self = this;
					var ui_canvas;
					
					var img_loader;
				
					var ctx_root;
					var ctx_menu_main;
					var ctx_menu_controls;
					var ctx_menu_cast;
					var ctx_level;
					
					var tiles = [];
					var tiletypes = [];
					
					var lastframetime;
					
					var internals = {
						"title_open": {
							"x": 147,
							"y": 27,
							"w": 13,
							"h": 146,
							"nx": 24
						}
					};
					
					var engine = { };
					
					var init_functions = [
						init_title_open,
						init_tiles,
						init_music,
						init_level_canvas
					];
					
					function create_canvas(w, h) {
						return $("<canvas>").attr("width", w).attr("height", h).get(0);
					}
					
					// Engine initialization functions
					function init_title_open() {
						var t = internals["title_open"];
						
						t.ctx_left = create_canvas(t.w, t.h).getContext("2d");
						t.ctx_right = create_canvas(t.w, t.h).getContext("2d");
						
						t.ctx_left.drawImage(res["title1"].image, t.x, t.y, t.w, t.h, 0, 0, t.w, t.h);
						t.ctx_right.drawImage(res["title1"].image, t.x + t.w, t.y, t.w, t.h, 0, 0, t.w, t.h);
					}
					
					function init_tiles() {
						var n = res["tiledata"].data.replace(/\r/g, "\n").split("\n");
						for (var i = 0; i < n.length; i++) {
							n[i] = $.trim(n[i]);
							if (n[i] == "") continue;
							if (n[i].charAt(0) == "#") continue;
							
							var x = n[i].split(",");
							if (x.length < 5) continue;
							
							var c = create_canvas(16, 16);
							c.getContext("2d").drawImage(res[x[0]].image, +x[1], +x[2], 16, 16, 0, 0, 16, 16);
							tiles.push(c);
							
							tiletypes.push(+x[4]);
						}
					}
					
					function init_music() {
						if (res.music && res.music.audio) {
							res.music.audio.loop = true;
						}
					}
					
					function init_level_canvas() {
						var c = create_canvas(960, 384);
						ctx_level = c.getContext("2d");
					}
					
					// ===============================================================================================
					// Internal engine functions
					// ===============================================================================================
					
					// title_fadein
					function _title_fadein_init() {
						engine.fun = _title_fade;
						engine.counters[0] = 0;
					}
					
					function _title_fadein(t) {
						engine.counters[0] += t / 1000;
						
						if (engine.counters[0] > 1) {
							engine.fun = _title_wait_init;
						}
						else {
							ctx_root.globalAlpha = 1.0;
							ctx_root.fillStyle = "#000";
							ctx_root.fillRect(0, 0, 320, 200);
							
							ctx_root.globalAlpha = engine.counters[0];
							ctx_root.drawImage(res["title"].image, 0, 0);
						}
					}
					
					// title_wait
					function _title_wait_init() {
						engine.counters[0] = 1000;
						engine.fun = _title_wait;
					}
					
					function _title_wait(t) {
						if ((engine.counters[0] -= t) <= 0) {
							engine.fun = _title_open_init;
						}
					}
					
					// title_open
					function _title_open_init() {
						ctx_root.globalAlpha = 1.0;
						ctx_root.drawImage(res["title1"].image, 0, 0);
						
						engine.temp = 0;
						
						var t = internals["title_open"];
						ctx_root.drawImage(t.ctx_left.canvas, t.x, t.y);
						ctx_root.drawImage(t.ctx_right.canvas, t.x + t.w, t.y);
						
						engine.fun = _title_open;
					}
					
					function _title_open(t) {
						engine.temp += t / 3;
						
						var t = internals["title_open"];
						
						if (engine.temp >= t.x - t.nx) {
							ctx_root.drawImage(res["title2"].image, 0, 0);
							engine.counters[0] = 1000;
							engine.fun = _title_fadeout_wait;
						}
						else {
							var n = Math.round(engine.temp);
							
							var bw = n * 2 + t.w;
							ctx_root.drawImage(res["title2"].image, t.x - n, 0, bw, 200, t.x - n, 0, bw, 200);
						
							ctx_root.drawImage(t.ctx_left.canvas, t.x - n, t.y);
							ctx_root.drawImage(t.ctx_right.canvas, t.x + t.w + n, t.y);
						}
					}
					
					// title_fadeout
					function _title_fadeout_wait(t) {
						if ((engine.counters[0] -= t) <= 0) {
							engine.counters[0] = 0;
							engine.fun = _title_fadeout;
						}
					}
					
					function _title_fadeout(t) {
						engine.counters[0] += t / 1000;
						
						if (engine.counters[0] >= 1) {
							engine.fun = _mainmenu_fadein_init;
						}
						else {
							ctx_root.globalAlpha = 1.0;
							ctx_root.drawImage(res["title2"].image, 0, 0);
						
							ctx_root.globalAlpha = engine.counters[0];
							ctx_root.fillStyle = "#000";
							ctx_root.fillRect(0, 0, 320, 200);
						}
					}
					
					// mainmenu_fadein
					function _mainmenu_fadein_init() {
						engine.counters[0] = 0;
						engine.fun = _mainmenu_fadein;
					}
					
					function _mainmenu_fadein(t) {
						engine.counters[0] += t / 1000;
						
						if (engine.counters[0] >= 1) {
							function start_level() {
								engine.level = {
									type: "builtin",
									index: 0
								};
								
								engine.fun = _mainmenu_fadeout_init;
								engine.temp = _game_fadein_init;
							}
							
							clear_clickzones();
							clear_keyboard_handlers();
							
							add_clickzone(94, 140, 21, 23, function() {
								start_level();
							});
							
							engine.cb_keydown = function(k) {
								if (k == 32) start_level();
							};
							
							music_start();
							
							engine.fun = undefined;
						}
						else {
							ctx_root.globalAlpha = 1.0;
							ctx_root.fillStyle = "#000";
							ctx_root.fillRect(0, 0, 320, 200);
						
							ctx_root.globalAlpha = engine.counters[0];
							ctx_root.drawImage(res["menu"].image, 0, 0);
						}
					}
					
					// mainmenu_fadeout
					function _mainmenu_fadeout_init() {
						engine.counters[0] = 1;
						clear_clickzones();
						clear_keyboard_handlers();
						engine.fun = _mainmenu_fadeout;
					}
					
					function _mainmenu_fadeout(t) {
						engine.counters[0] -= t / 1000;
						
						if (engine.counters[0] <= 0) {
							engine.fun = engine.temp;
							engine.temp = undefined;
						}
						else {
							ctx_root.globalAlpha = 1.0;
							ctx_root.fillStyle = "#000";
							ctx_root.fillRect(0, 0, 320, 200);
						
							ctx_root.globalAlpha = engine.counters[0];
							ctx_root.drawImage(res["menu"].image, 0, 0);
						}
					}
					
					// game_fadein
					function _game_fadein_init() {
						ctx_root.globalAlpha = 1.0;
						
						var i = engine.level.index * 1536;
						
						console.log("[jsSupaplex] Loading level...");
						
						engine.level.tiles = [];
						engine.level.title = res["levels"].data.substring(i + 1446, i + 1470);
						
						engine.level.player_x = 0;
						engine.level.player_y = 0;
						
						for (var x = 0; x < 60; x++) {
							var n = [];
							
							for (var y = 0; y < 24; y++) {
								var c = res["levels"].data.charCodeAt(i + x + y * 60);
								n.push(c);
								ctx_level.drawImage(tiles[c], x * 16, y * 16);
								
								if (c == 3) {
									engine.level.player_x = x;
									engine.level.player_y = y;
								}
							}
							
							engine.level.tiles.push(n);
						}
						
						console.log("[jsSupaplex] Starting point is at " + engine.level.player_x + ", " + engine.level.player_y);
						
						// Set starting camera position
						engine.camera_x = engine.level.player_x * 16 + 8 - 160;
						engine.camera_y = engine.level.player_y * 16 + 8 - 100;
						
						console.log("[jsSupaplex] Initial camera position is " + engine.camera_x + ", " + engine.camera_y);
						
						// Initialize counters
						engine.counters[0] = 0;	// Fade in timer
						engine.counters[1] = 0;	// Tile check timer
						engine.counters[2] = 0; // Death clock
						
						engine.temp = {
							"player_control": true,
							"player_command": ""
						};
						
						// Enable game logic
						engine.fun = _game_fadein;
						
						console.log("[jsSupaplex] Loaded level \"" + engine.level.title + "\"");
					}
					
					function _game_fadein(t) {
						engine.counters[0] += t / 1000;
						
						if (engine.counters[0] >= 1) {
							engine.fun = _game_main;
							engine.cb_keydown = _game_keydown;
							engine.cb_keyup = _game_keyup;
						}
						else {
							ctx_root.globalAlpha = 1.0;
							ctx_root.fillStyle = "#000";
							ctx_root.fillRect(0, 0, 320, 200);
						
							ctx_root.globalAlpha = engine.counters[0];
						
							var cx = engine.camera_x;
							var cy = engine.camera_y;
						
							if (cx < 0) cx = 0;
							else if (cx > 640) c = 640;
						
							if (cy < 0) cy = 0;
							else if (cy > 184) cy = 184;
						
							ctx_root.drawImage(ctx_level.canvas, -cx, -cy);
						}
					}
					
					function _game_main(t) {
						if (engine.temp.player_dead) {
							if ((engine.counters[2] += t) >= 1000) {
								engine.fun = undefined;
							}
						}
						
						engine.counters[1] += t;
						var redraw_level = false;
						var lt = engine.level.tiles;
						
						function check_player_movement() {
							if (engine.temp.player_control) {
								if (engine.temp.player_command == "left") {
									var n = lt[engine.level.player_x - 1][engine.level.player_y];
									
									if (n == 2) {
										engine.temp.player_control = false;
										set_tile(engine.level.player_x - 1, engine.level.player_y, 40);
										set_tile(engine.level.player_x, engine.level.player_y, 41);
										redraw_level = true;
									}
									else if (n == 0) {
										engine.temp.player_control = false;
										set_tile(engine.level.player_x - 1, engine.level.player_y, 72);
										set_tile(engine.level.player_x, engine.level.player_y, 73);
										redraw_level = true;
									}
									else if (tiletypes[n] & 0x08) {
										kill_player();
									}
								}
								else if (engine.temp.player_command == "right") {
									var n = lt[engine.level.player_x + 1][engine.level.player_y];
									
									if (n == 2) {
										engine.temp.player_control = false;
										set_tile(engine.level.player_x, engine.level.player_y, 56);
										set_tile(engine.level.player_x + 1, engine.level.player_y, 57);
										redraw_level = true;
									}
									else if (n == 0) {
										engine.temp.player_control = false;
										set_tile(engine.level.player_x, engine.level.player_y, 88);
										set_tile(engine.level.player_x + 1, engine.level.player_y, 89);
										redraw_level = true;
									}
									else if (tiletypes[n] & 0x08) {
										kill_player();
									}
								}
								else if (engine.temp.player_command == "up") {
									var n = lt[engine.level.player_x][engine.level.player_y - 1];
									
									if (n == 2) {
										engine.temp.player_control = false;
										set_tile(engine.level.player_x, engine.level.player_y - 1, 104);
										set_tile(engine.level.player_x, engine.level.player_y, 105);
										redraw_level = true;
									}
									else if (n == 0) {
										engine.temp.player_control = false;
										set_tile(engine.level.player_x, engine.level.player_y - 1, 136);
										set_tile(engine.level.player_x, engine.level.player_y, 137);
										redraw_level = true;
									}
									else if (tiletypes[n] & 0x08) {
										kill_player();
									}
								}
								else if (engine.temp.player_command == "down") {
									var n = lt[engine.level.player_x][engine.level.player_y + 1];
									
									if (n == 2) {
										engine.temp.player_control = false;
										set_tile(engine.level.player_x, engine.level.player_y, 120);
										set_tile(engine.level.player_x, engine.level.player_y + 1, 121);
										redraw_level = true;
									}
									else if (n == 0) {
										engine.temp.player_control = false;
										set_tile(engine.level.player_x, engine.level.player_y, 152);
										set_tile(engine.level.player_x, engine.level.player_y + 1, 153);
										redraw_level = true;
									}
									else if (tiletypes[n] & 0x08) {
										kill_player();
									}
								}
							}
						}
						
						// Game logic
						while (engine.counters[1] >= 15) {
							for (var y = 0; y < 24; y++) {
								for (var x = 0; x < 60; x++) {
									var c = lt[x][y];
									
									// Movement - Left
									if (c >= 72 && c <= 84 && !(c % 2)) {
										set_tile(x, y, c + 2);
										set_tile(x + 1, y, c + 3);
										engine.level.player_x -= 0.125;
										redraw_level = true;
									}
									else if (c == 86) {
										set_tile(x, y, 3);
										set_tile(x + 1, y, 0);
										engine.level.player_x = x;
										engine.temp.player_control = true;
										check_player_movement();
										redraw_level = true;
									}
									
									// Movement - Right
									else if (c >= 88 && c <= 100 && !(c % 2)) {
										set_tile(x, y, c + 2);
										set_tile(x + 1, y, c + 3);
										engine.level.player_x += 0.125;
										redraw_level = true;
									}
									else if (c == 102) {
										set_tile(x, y, 0);
										set_tile(x + 1, y, 3);
										engine.level.player_x = x + 1;
										engine.temp.player_control = true;
										check_player_movement();
										redraw_level = true;
									}
									
									// Movement - Up
									else if (c >= 136 && c <= 148 && !(c % 2)) {
										set_tile(x, y, c + 2);
										set_tile(x, y + 1, c + 3);
										engine.level.player_y -= 0.125;
										redraw_level = true;
									}
									else if (c == 150) {
										if (tiletypes[lt[x][y - 1]] & 0x10) {
											// We went up into something that usually falls but couldn't fall because of invalid tiles
											set_tile(x, y, 0);
											set_tile(x, y + 1, 0);
											kill_player();
										}
										else {
											set_tile(x, y, 3);
											set_tile(x, y + 1, 0);
											engine.level.player_y = y;
											engine.temp.player_control = true;
											check_player_movement();
										}
										
										redraw_level = true;
									}
									
									// Movement - Down
									else if (c >= 152 && c <= 164 && !(c % 2)) {
										set_tile(x, y, c + 2);
										set_tile(x, y + 1, c + 3);
										engine.level.player_y += 0.125;
										redraw_level = true;
									}
									else if (c == 166) {
										set_tile(x, y, 0);
										set_tile(x, y + 1, 3);
										engine.level.player_y = y + 1;
										engine.temp.player_control = true;
										check_player_movement();
										redraw_level = true;
									}
									
									// Movement - Left through base
									else if (c >= 40 && c <= 52 && !(c % 2)) {
										set_tile(x, y, c + 2);
										set_tile(x + 1, y, c + 3);
										engine.level.player_x -= 0.125;
										redraw_level = true;
									}
									else if (c == 54) {
										set_tile(x, y, 3);
										set_tile(x + 1, y, 0);
										engine.level.player_x = x;
										engine.temp.player_control = true;
										check_player_movement();
										redraw_level = true;
									}
									
									// Movement - Right through base
									else if (c >= 56 && c <= 68 && !(c % 2)) {
										set_tile(x, y, c + 2);
										set_tile(x + 1, y, c + 3);
										engine.level.player_x += 0.125;
										redraw_level = true;
									}
									else if (c == 70) {
										set_tile(x, y, 0);
										set_tile(x + 1, y, 3);
										engine.level.player_x = x + 1;
										engine.temp.player_control = true;
										check_player_movement();
										redraw_level = true;
									}
									
									// Movement - Up through base
									else if (c >= 104 && c <= 116 && !(c % 2)) {
										set_tile(x, y, c + 2);
										set_tile(x, y + 1, c + 3);
										engine.level.player_y -= 0.125;
										redraw_level = true;
									}
									else if (c == 118) {
										set_tile(x, y, 3);
										set_tile(x, y + 1, 0);
										engine.level.player_y = y;
										engine.temp.player_control = true;
										check_player_movement();
										redraw_level = true;
									}
									
									// Movement - Down through base
									else if (c >= 120 && c <= 132 && !(c % 2)) {
										set_tile(x, y, c + 2);
										set_tile(x, y + 1, c + 3);
										engine.level.player_y += 0.125;
										redraw_level = true;
									}
									else if (c == 134) {
										set_tile(x, y, 0);
										set_tile(x, y + 1, 3);
										engine.level.player_y = y + 1;
										engine.temp.player_control = true;
										check_player_movement();
										redraw_level = true;
									}
									
									// Zonk - Fall down
									else if (c == 1 && lt[x][y + 1] == 0) {
										set_tile(x, y, 168);
										set_tile(x, y + 1, 169);
										redraw_level = 1;
									}
									else if (c >= 168 && c <= 180 && !(c % 2)) {
										set_tile(x, y, c + 2);
										set_tile(x, y + 1, c + 3);
										redraw_level = true;
									}
									else if (c == 182) {
										if (tiletypes[lt[x][y + 2]] & 0x01) {
											// We fell on top of the player, kill him!
											set_tile(x, y, 0);
											set_tile(x, y + 1, 1);
											kill_player();
										}
										else if (lt[x][y + 2] == 0) {
											set_tile(x, y, 0);
											set_tile(x, y + 1, 168);
											set_tile(x, y + 2, 169);
										}
										else {
											set_tile(x, y, 0);
											set_tile(x, y + 1, 1);
										}
										redraw_level = true;
									}
									
									// Zonk - Roll right
									else if (c == 1 && (tiletypes[lt[x][y + 1]] & 0x20) && lt[x + 1][y] == 0 && lt[x + 1][y + 1] == 0) {
										set_tile(x, y, 216);
										set_tile(x + 1, y, 217);
										redraw_level = true;
									}
									else if (c >= 216 && c <= 228 && !(c % 2) && lt[x + 1][y + 1] == 0) {
										set_tile(x, y, c + 2);
										set_tile(x + 1, y, c + 3);
										redraw_level = true;
									}
									else if (c == 230) {
										set_tile(x, y, 0);
										
										if (lt[x + 1][y + 1] == 0) {
											set_tile(x + 1, y, 168);
											set_tile(x + 1, y + 1, 169);
										}
										else {
											set_tile(x + 1, y, 1);
										}
										
										redraw_level = true;
									}
									
									// Zonk - Roll left
									else if (c == 1 && (tiletypes[lt[x][y + 1]] & 0x20) && lt[x - 1][y] == 0 && lt[x - 1][y + 1] == 0) {
										set_tile(x - 1, y, 232);
										set_tile(x, y, 233);
										redraw_level = true;
									}
									else if (c >= 232 && c <= 244 && !(c % 2) && lt[x][y + 1] == 0) {
										set_tile(x, y, c + 2);
										set_tile(x + 1, y, c + 3);
										redraw_level = true;
									}
									else if (c == 246) {
										set_tile(x + 1, y, 0);
										
										if (lt[x][y + 1] == 0) {
											set_tile(x, y, 168);
											set_tile(x, y + 1, 169);
										}
										else {
											set_tile(x, y, 1);
										}
										
										redraw_level = true;
									}
									
									// Infotron - Fall down
									else if (c == 4 && lt[x][y + 1] == 0) {
										/*
										set_tile(x, y, 184);
										set_tile(x, y + 1, 185);
										*/
									}
									
									// Explosion
									else if (c >= 184 && c <= 214) {
										set_tile(x, y, c + 1);
										redraw_level = true;
									}
									else if (c == 215) {
										set_tile(x, y, 0);
										redraw_level = true;
									}
								}
							}
							
							// Player movement
							check_player_movement();
							
							engine.counters[1] -= 15;
						}
						
						if (redraw_level) {
							var cx = Math.round(engine.level.player_x * 16 + 8 - 160);
							var cy = Math.round(engine.level.player_y * 16 + 8 - 100);
						
							if (cx < 0) cx = 0;
							else if (cx > 640) c = 640;
						
							if (cy < 0) cy = 0;
							else if (cy > 184) cy = 184;
							
							ctx_root.drawImage(ctx_level.canvas, -cx, -cy);
						}
					}
					
					function _game_keydown(k) {
						if (k == 37) engine.temp.player_command = "left";
						else if (k == 39) engine.temp.player_command = "right";
						else if (k == 38) engine.temp.player_command = "up";
						else if (k == 40) engine.temp.player_command = "down";
						else if (k == 27) {
							kill_player();
						}
						else console.log(k);
					}
					
					function _game_keyup(k) {
						if (k == 37 && engine.temp.player_command == "left") engine.temp.player_command = "";
						else if (k == 39 && engine.temp.player_command == "right") engine.temp.player_command = "";
						else if (k == 38 && engine.temp.player_command == "up") engine.temp.player_command = "";
						else if (k == 40 && engine.temp.player_command == "down") engine.temp.player_command = "";
					}
					
					// ===============================================================================================
					// Game logic functions
					// ===============================================================================================
					function kill_player() {
						if (engine.temp.player_dead) return;
						
						clear_keyboard_handlers();
						
						engine.temp.player_control = false;
						engine.temp.player_dead = true;
						
						var px = Math.round(engine.level.player_x);
						var py = Math.round(engine.level.player_y);
						
						set_tile(px, py, 184);
						spawn_explosion(px, py);
					}
					
					function spawn_explosion(px, py) {
						var subexplosions = [];
						
						for (var y = py - 1; y <= py + 1; y++) {
							for (var x = px - 1; x <= px + 1; x++) {
								var t = tiletypes[engine.level.tiles[x][y]];
								
								if (t & 0x01) kill_player(x, y);
								else if (t & 0x02) {
									// TODO: Delay!
									subexplosions.push([x, y]);
									set_tile(x, y, 184);
								}
								else if (t & 0x04) set_tile(x, y, 184);
							}
						}
						
						$.each(subexplosions, function(key, val) {
							spawn_explosion(val[0], val[1]);
						});
					}
					
					// ===============================================================================================
					// Internal functions
					// ===============================================================================================
					function set_tile(x, y, t) {
						engine.level.tiles[x][y] = t;
						ctx_level.drawImage(tiles[t], x * 16, y * 16);
					}
					
					function clear_keyboard_handlers() {
						engine.cb_keydown = undefined;
						engine.cb_keypress = undefined;
						engine.cb_keyup = undefined;
					}
					
					function clear_clickzones() {
						engine.clickzones = [];
					}
					
					function add_clickzone(x, y, w, h, f) {
						engine.clickzones.push({
							"x": x,
							"y": y,
							"w": w,
							"h": h,
							"cb_click": f
						});
					}
					
					function music_start() {
						if (opts.enableMusic && res.music && res.music.audio && res.music.audio.paused) {
							res.music.audio.play();
						}
					}
					
					function music_stop() {
						if (opts.enableMusic && res.music && res.music.audio && !res.music.audio.paused) {
							res.music.audio.pause();
							res.music.audio.currentTime = 0;
						}
					}
					
					function init() {
						// Detect canvas support
						// TODO
						
						// Detect audio support
						try {
							var o = new Audio("");
							capabilities.audio_canplaytype = !!(o.canPlayType);
							capabilities.audio = !!(!capabilities.audio ? o.play : false);
							
							if (capabilities.audio_canplaytype) {
								capabilities.audio_format_ogg = (o.canPlayType("audio/ogg") != "no" && o.canPlayType("audio/ogg") != "");
								capabilities.audio_format_mp3 = (o.canPlayType("audio/mpeg") != "no" && o.canPlayType("audio/mpeg") != "");
							}
							
							if (capabilities.audio_format_ogg) audio_format = "ogg";
							else if (capabilities.audio_format_mp3) audio_format = "mp3";
							
							if (audio_format && opts.enableMusic) {
								res["music"] = { "filename": "music." + audio_format, "type": "audio", "canskip": true, "buffer": true };
							}
						}
						catch(e) { }
						
						// Initialize canvas
						ui_canvas = $("<canvas>Your browser doesn't support HTML5 canvas :(</canvas>")
							.attr("width", "320")
							.attr("height", "200")
							.css({
								"width": "100%",
								"height": "100%"
							})
							.mousemove(function(e) {
								var m = get_mouse_coords(e);
								canvas_mousemove(m.x, m.y);
								return false;
							})
							.mousedown(function(e) {
								var m = get_mouse_coords(e);
								canvas_mousedown(m.x, m.y);
								return false;
							});
						
						$(document)
							.keydown(canvas_keydown)
							.keypress(canvas_keypress)
							.keyup(canvas_keyup);
							
						ui_base.html(ui_canvas);
						
						if (!opts.useBrowserCursor) ui_canvas.css("cursor", "none");
				
						ctx_root = ui_canvas.get(0).getContext("2d");
				
						ctx_root.fillStyle = "#fff";
						ctx_root.fillRect(0, 0, 320, 200);
				
						img_loader = new Image();
						img_loader.onload = function() {
							ctx_root.drawImage(img_loader, 160 - img_loader.width / 2, 100 - img_loader.height / 2);
							
							// Draw progress bar background
							ctx_root.fillStyle = "#afcaff";
							ctx_root.fillRect(160 - 48, 112, 96, 6);
							
							load_resources();
						};
						img_loader.src = g_img_loader;
					}
					
					function load_resources() {
						var nextres;
						var loadcount = 0;
						var totalcount = 0;
						
						$.each(res, function(key, val) {
							totalcount++;
							if (!val.loaded) {
								nextres = val;
								nextres.url = (opts.resPath + "/" + nextres.filename).replace("//", "/");
							}
							else loadcount++;
						});
						
						if (nextres) {
							console.log("[jsSupaplex] Loading resource: " + nextres.url);
							
							var c = Math.round((96.0 / totalcount) * (loadcount + 1));
							ctx_root.fillStyle = "#05f";
							ctx_root.fillRect(160 - 48, 112, c, 6);
							
							if (nextres.type == "gfx") {
								nextres.image = new Image();
								nextres.image.onload = function() {
									nextres.loaded = 1;
									load_resources();
								};
								nextres.image.src = nextres.url;
							}
							else if (nextres.type == "audio") {
								nextres.audio = new Audio("");
								nextres.audio.preload = "no";
								nextres.audio.autoplay = false;
								nextres.audio.src = nextres.url;
								
								if (nextres.buffer) {
									nextres.audio.load();
									nextres.loaded = 1;
									load_resources();
								}
								else {
									nextres.audio.addEventListener("loadeddata", function() {
											nextres.loaded = 1;
											load_resources();
										}, false);
								}
							}
							else {
								$.ajax({
										"url": nextres.url,
										"type": "GET",
										"success": function(data) {
											nextres.loaded = 1;
											nextres.data = data;
											load_resources();
										},
										"error": function(e) {
											console.log(e);
											ctx_root.fillStyle = "#f00";
											ctx_root.fillRect(0, 0, 320, 200);
											ctx_root.drawImage(img_loader, 160 - img_loader.width / 2, 100 - img_loader.height / 2);
										}
									});
							}
						}
						else {
							for (var i = 0; i < init_functions.length; i++) {
								init_functions[i]();
							}
							
							self.reset();
							start_engine();
							
							opts.onReady();
						}
					}
					
					function get_mouse_coords(ev) {
						var o = ui_canvas.offset();
						var x = Math.floor((ev.pageX - o.left) * (320 / ui_canvas.outerWidth()));
						var y = Math.floor((ev.pageY - o.top) * (200 / ui_canvas.outerHeight()));
						
						return { "x": x, "y": y };
					}
					
					function canvas_mousemove(x, y) {
						if (!engine) return;
					}
					
					function canvas_mousedown(x, y) {
						if (!engine) return;
						$.each(engine.clickzones, function(key, val) {
							if (x >= val.x && y >= val.y && x <= val.x + val.w && y <= val.y + val.h) {
								val.cb_click();
								return;
							}
						});
					}
					
					function canvas_keydown(e) {
						if (engine.cb_keydown) engine.cb_keydown(e.keyCode);
					}
					
					function canvas_keypress(e) {
						if (engine.cb_keypress) engine.cb_keypress(e.keyCode);
					}
					
					function canvas_keyup(e) {
						if (engine.cb_keyup) engine.cb_keyup(e.keyCode);
					}
					
					function start_engine() {
						console.log("[jsSupaplex] Starting engine...");
						
						lastframetime = (new Date()).getTime();
						requestAnimFrame(think);
					}
					
					function think() {
						var t = (new Date()).getTime();
						if (engine.fun) engine.fun(t - lastframetime);
						lastframetime = t;
						requestAnimFrame(think);
					}
					
					// ===============================================================================================
					// External functions
					// ===============================================================================================
					self.reset = function() {
						console.log("[jsSupaplex] Resetting...");
						
						music_stop();
						
						engine = {
							fun: _title_fadein,
							counters: [ 0, 0, 0, 0, 0 ],
							clickzones: []
						};
					};
					
					self.playlevel = function(opts) {
						console.log("[jsSupaplex] Starting level...");
						engine.fun = _game_fadein_init;
						engine.level = {
							"type": opts.type || "builtin",
							"index": opts.level || 0
						};
					};
					
					// ===============================================================================================
					// START!
					// ===============================================================================================
					init();
				})($(this));
			});
			
			return this;
		},
		reset: function() {
			this.each(function() { $(this).data("jsSupaplex").reset(); });
		},
		playlevel: function(opts) {
			this.each(function() { $(this).data("jsSupaplex").playlevel(opts); });
		}
	};
	
	$.fn.jsSupaplex = function(method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		}
		else $.error("Invalid method " + method);
	};
})(jQuery);

