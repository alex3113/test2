var Tree = {

    /**
     * List of specie loaded from server
     * @var array
     */
    speciesList : [],

    /**
     * Current tree species HTML
     * @var array
     */
    treeSpecies : [],

    speciePopoverTemplate : '',

    /**
     * Test mode (didnt load data from server)
     */
    testMode : false,

    /**
     * Load and draw tree from server
     * @returns {Tree}
     */
    drawTree : function()
    {
        // Load species from server
        this.loadSpeciesList();

        // Clean and cache Tree div
        var $tree = $('#tree .drawTree');
        $tree.html('');

        this.treeSpecies = [];

        $.each(this.speciesList, function(specieId, specieData) {

            // Check level is created in treeSpecie
            if(Tree.treeSpecies[specieData.level] == undefined) {
                Tree.treeSpecies[specieData.level] = [];
            }

            // Add specie in level box
            Tree.treeSpecies[specieData.level].push(getHTMLFromObject(Tree.generateSpecieBox(specieData)));

        });

        // Order treeSpecie by level ASC
        this.treeSpecies.sort();

        // Generate full HTML of tree
        $.each(this.treeSpecies, function(level, species){
            var levelHTML = $('<div>')
                    .addClass('tree-level')
                    .data('level', level)
                ;

            // Generate header
            levelHTML.append($('<div>').addClass('level-title').html('Niveau '+ level));

            // Generate species are
            var speciesHTML = $('<div>').addClass('level-species');

            speciesHTML.append(species.join(''));
            levelHTML.append(speciesHTML);
            Tree.treeSpecies[level] =  getHTMLFromObject(levelHTML);
        });

        $tree.html(this.treeSpecies.join(''));

        // Refresh tree event
        $('.tree-popover').popover();
        $('a[rel=tooltip]').tooltip();

        $('.tree-popover button').click(function(){alert('ok');});

        return this;
    },

    /**
     * Generate specie box and set values
     * @param specieData
     * @returns {*|jQuery}
     */
    generateSpecieBox : function(specieData)
    {
        var specieBox = $('<div>').addClass('ptld-box tree-speciebox tree-popover').attr('data-specieid', specieData.id);

        // Insert specie image
        specieBox.append($('<img>').addClass('speciebox-img').attr('src','specie.png'));

        // Insert specie name
        specieBox.append($('<div>').addClass('speciebox-name').html(specieData.name));

        // Insert specie number
        specieBox.append($('<div>').addClass('speciebox-number').html(number_format(specieData.number,0,'.',' ')));

        // Insert specie types
        var specieTypeHTML  = $('<div>').addClass('speciebox-types');
        $.each(specieData.types, function(specieTypeId, specieType){
            specieTypeHTML.append(getHTMLFromObject(Tree.getSpecieTypeView(specieTypeId, specieType)));
        });

        specieBox.append(getHTMLFromObject(specieTypeHTML));

        specieBox = this.bindSpeciePopover(specieBox, specieData);

        return specieBox;
    },

    /**
     * Generate specie type view (link + image)
     * @param specieTypeId
     * @param specieType
     * @returns {jQuery}
     */
    getSpecieTypeView : function(specieTypeId, specieType)
    {
        var specieTypeImg = $('<img>').attr('src','ico_type.png');
        var specieTypeLink = $('<a>')
            .attr('href','#')
            .attr('rel','tooltip')
            .attr('data-toggle','tooltip')
            .attr('data-placement','bottom')
            .attr('title', specieType.name)
            .append(specieTypeImg);

        return specieTypeLink;
    },

    /**
     * Bind specie popup with specie data on specie box
     * @param specieBox
     * @param specieData
     * @returns {*}
     */
    bindSpeciePopover : function(specieBox, specieData)
    {
        var speciePopover = this.getSpeciePopoverTemplate();

        // Add specie id
        speciePopover.attr('data-specieid', specieData.id);

        // Update basic data
        $('.speciepopover-img',speciePopover).attr('src','specie.png');
        $('.speciepopover-name',speciePopover).html(specieData.name);
        $('.speciepopover-number',speciePopover).html(number_format(specieData.number));

        // Add specie types
        $.each(specieData.types, function(specieTypeId, specieType){
            $('.speciepopover-types',speciePopover).append(getHTMLFromObject(Tree.getSpecieTypeView(specieTypeId, specieType)));
        });

        // Add buttons
        var btnInput        = $('<input>').addClass('ptld-btn').attr('name','number').attr('value',0);
        var btnCloning      = $('<button>').addClass('ptld-btn').attr('onClick','Tree.doSpecieAction('+specieData.id+',"clone");').html('Cloner');
        var btnMutate       = $('<button>').addClass('ptld-btn').attr('onClick','Tree.doSpecieAction('+specieData.id+',"mutate");').html('Muter');
        var btnDelete       = $('<button>').addClass('ptld-btn').attr('onClick','Tree.doSpecieAction('+specieData.id+',"delete");').html('Eradiquer');
        var btnSacrify      = $('<button>').addClass('ptld-btn').attr('onClick','Tree.doSpecieAction('+specieData.id+',"sacrify");').html('Sacrifier');
        var btnAttack       = $('<button>').addClass('ptld-btn').attr('onClick','Tree.doSpecieAction('+specieData.id+',"attack");').html('Attaque');
        var btnDefense      = $('<button>').addClass('ptld-btn').attr('onClick','Tree.doSpecieAction('+specieData.id+',"defense");').html('Défense');

        $('.speciepopover-actions',speciePopover).append(btnInput);
        $('.speciepopover-actions',speciePopover).append(btnCloning);
        $('.speciepopover-actions',speciePopover).append("<br /><br />");
        $('.speciepopover-actions',speciePopover).append(btnMutate);
        $('.speciepopover-actions',speciePopover).append(btnDelete);
        $('.speciepopover-actions',speciePopover).append(btnSacrify);
        $('.speciepopover-actions',speciePopover).append("<br /><br />");
        $('.speciepopover-actions',speciePopover).append(btnAttack);
        $('.speciepopover-actions',speciePopover).append(btnDefense);

        specieBox
            .addClass('popover-dismiss')
            .attr('data-toggle', 'popover')
            .attr('data-html', 'true')
            .attr('data-placement', 'bottom')
            .attr('data-content', getHTMLFromObject(speciePopover))
        ;

        return specieBox;
    },

    /**
     * Send action to server
     * @param specieId
     * @param action
     */
    doSpecieAction : function(specieId, action)
    {
        var specieBoxInputNumber = $('.tree-speciepopover[data-specieid='+specieId+'] input[name=number]').val();

        switch (action) {
            case "clone":
                actionRoute = Routing.generate('td_game_specie_clone', { specie: specieId, number: specieBoxInputNumber });
                break;
            case "mutate":
                actionRoute = Routing.generate('td_game_specie_mutate', { specie: specieId });
                break;
            case "delete":
                actionRoute = Routing.generate('td_game_specie_delete', { specie: specieId });
                break;
            case "sacrify":
                actionRoute = Routing.generate('td_game_specie_sacrify', { specie: specieId, number: specieBoxInputNumber });
                break;
            case "attack":
                actionRoute = Routing.generate('td_game_specie_attack', { specie: specieId, number: specieBoxInputNumber });
                break;
            case "defense":
                actionRoute = Routing.generate('td_game_specie_defense', { specie: specieId, number: specieBoxInputNumber });
                break;
            default:
                return false;
        }

        $.ajax({
            url:   actionRoute,
            dataType:   "json",
            async:      false,
            success:    function(resultCloning){
                if(resultCloning.result == "OK") {
                    Tree.drawTree();
                } else {
                    alert(resultCloning.message);
                }
            }
        });

        return false;
    },

    /**
     * Generate specie popover template
     * @returns {string}
     */
    getSpeciePopoverTemplate : function()
    {
        // If template already generated return it (cache performance)
        if(this.speciePopoverTemplate != '') { return this.speciePopoverTemplate.clone(); }

        // Generate specie popover
        var speciePopover = $('<div>').addClass('tree-speciepopover');

        // Insert specie image
        speciePopover.append($('<img>').addClass('speciepopover-img').attr('src','specie.png'));

        // Insert specie name
        speciePopover.append($('<div>').addClass('speciepopover-name'));

        // Insert specie number
        speciePopover.append($('<div>').addClass('speciepopover-number'));

        // Insert specie types
        speciePopover.append($('<div>').addClass('speciepopover-types'));

        // Insert buttons
        speciePopover.append($('<div>').addClass('speciepopover-actions clear-both'));

        this.speciePopoverTemplate = speciePopover;

        return this.speciePopoverTemplate.clone();
    },

    /**
     * Load species list from server
     * @returns {boolean}
     */
    loadSpeciesList : function()
    {
        // If test mode return test data
        if(this.testMode) {
            this.speciesList = {"1":{"id":1,"name":"specie1","number":1000,"parent":false,"level":0,"types":{}},"2":{"id":2,"name":"specie2","number":100,"parent":false,"level":0,"types":[]},"3":{"id":3,"name":"specie3","number":100,"parent":false,"level":0,"types":[]},"4":{"id":4,"name":"specie4","number":100,"parent":1,"level":1,"types":[]},"5":{"id":5,"name":"specie5","number":100,"parent":2,"level":1,"types":[]},"6":{"id":6,"name":"specie6","number":100,"parent":5,"level":2,"types":{"1":{"id":1,"name":"type1"},"2":{"id":2,"name":"type2"}}}};
            return true;
        }

        $.ajax({
            url:   Routing.generate('td_game_tree_species_list'),
            dataType:   "json",
            async:      false,
            success:    function(speciesList){ Tree.speciesList = speciesList; }
        });
    }
};
