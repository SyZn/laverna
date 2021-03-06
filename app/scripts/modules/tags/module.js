/**
 * Copyright (C) 2015 Laverna project Authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/* global define */
define([
    'underscore',
    'backbone.radio'
    // 'xregexp/addons/unicode/unicode-categories'
], function(_, Radio) {
    'use strict';

    /**
     * Tag module.
     *
     * Replies to requests on channel `editor`:
     * 1. `get:tags` - searches provided text for tags and returns them.
     *
     * Listens to events:
     * 1. channel: `editor`, event: `converter:init`
     *    adds custom hooks.
     */
    var Tags = {

        /**
         * Prepares the regular expression.
         * For default, every word which begins with # symbol is considered as
         * a tag but the symbol can be modified.
         */
        configure: function() {
            this.symbol = Radio.request('configs', 'get:config', 'tagSymbol', '#');
            // this.regex = new XRegExp('(^|[^' + this.symbol + '\\p{L}\\p{N}])' + this.symbol + '([\\p{L}\\p{N}\-\+]+)', 'g');

            // Regex: /([^\s])?#+?([^\s\.#])+/gm;
            this.regex = new RegExp('([^\\s])?' + this.symbol + '+?([^\\s\\.\\,' + this.symbol + '])+', 'gm');
        },

        /**
         * Return true if:
         * it starts with # symbol
         * and
         * it doesn't contain /
         */
        testForTag: function(tag) {
            return (new RegExp('^' + this.symbol).test(tag) && /\//.test(tag) === false);
        },

        /**
         * Search text for words which begin with a special symbol and replace
         * them to a tag link.
         */
        replaceTags: function(text) {
            var self = this,
                uri;

            return text.replace(this.regex, function(tag) {
                if (!self.testForTag(tag)) {
                    return tag;
                }

                uri = Radio.request('uri', 'link:profile', '/notes/f/tag/q/' + tag.replace('#', ''));
                return ' <a class="label label-default" href="#' + uri +
                     '">' + tag + '</a>';
            });
        },

        /**
         * Parse text for tags.
         */
        getTags: function(text) {
            var result = text.match(this.regex),
                tags   = [];

            _.each(result, function(tag) {
                if (this.testForTag(tag)) {
                    tags.push(tag.trim().replace(Tags.symbol, ''));
                }
            }, this);

            return _.uniq(tags);
        },

        /**
         * Add hooks to Pagedown editor
         */
        addHook: function(converter) {
            converter.hooks.chain('preBlockGamut', function(text) {
                return Tags.replaceTags(text);
            });
        }
    };

    Radio.request('init', 'add', 'module', function() {
        // Setup regex
        Tags.configure();

        // Parses text for tags
        Radio.reply('editor', 'get:tags', Tags.getTags, Tags);

        // When editor converter is initialized, add hooks
        Radio.on('editor', 'converter:init', Tags.addHook, Tags);
    });

    return Tags;

});
