/** cla chooser main javascript by Fabricatorz **/

/**
 * @TODO add other scaffolding for html5, standard sites, async
 * @TODO fix testGeneralPage() to be functionized so that each input tested
 * @TODO need to have some kind of timeout on the shorturl service, its blocking when service down
 */


// TODO - for testing, having debug switch as a query parameter or similar would be nice
var doDebug             = false;
var debugNeedle         = 1337;

var services;

var gitversion;

/*
 * This function gets the version.log file from the main folder. This is set with a git hook, and is uses to be aware which version of the app is deployed at any one time.
 */

$.ajax({
    timeout: 1000,
    async: false,
    url: 'version.log',
    dataType: "text",
    success: function(data) {
        gitversion = data;
    }
});

/*
 * This displays the gitversion hash from before
 */
$('#version').html(gitversion)

/*
* This reads config options from js/config.json, f.e. the serviceUrl. It is currently used inconsistently.
*/
$.ajax({
    timeout: 1000,
    async: false,
    url: 'js/config.json',
    dataType: "text",
    success: function(data) {
        services = $.parseJSON(data);
    }
});

/*
 * As of 25.03.2024 these are the same as in the config.json.
 */

var serviceUrl, urlShortener;

if ( ! services || typeof services.serviceUrl === 'undefined' )
    // was: service.contributoragreements.org, but this would have required separate SSL cert
    serviceUrl          = 'https://contributoragreements.org';
else
    serviceUrl          = services["serviceUrl"];

if ( ! services || typeof services.urlShortener === 'undefined' )
    // this url does not exist right now, but does not make sense to run on service. and subdir seperately
    urlShortener        = 'https://contributoragreements.org/u2s';
else
    urlShortener        = services["urlShortener"];

/*
 * These set up various variables to keep state of the chooser. FIXME are they really necessary?
 */

var generalPageIndex    = 0;
var isGeneralPageOk     = false;

var copyrightPageIndex  = 1;
var isCopyrightPageOk   = false;

var patentPageIndex     = 2;
var isPatentPageOk      = false;

var reviewPageIndex     = 3;
var isReviewPageOk      = false;

var applyPageIndex      = 4;
var isApplyPageOk       = false;

var outboundCopyrightLicenses = '';
var LicensePolicyLocation = '';
var mediaLicenses       = '';


var naField             = 'Not Applicable';
var emptyField          = '____________________';
var noneField           = 'None.'

var outBeforeField      = 'the following';
var outAfterField       = 'license(s)';
var fsfeField            = 'any licenses the Free Software Foundation classifies as Free Software licenses and which are approved by the Open Source Initiative as Open Source licenses.';

var fsfePreamble        = '<h3>Preamble</h3>\n Access to software determines participation in a digital society. To secure equal participation in the information age, the Free Software Foundation Europe (FSFE) pursues and is dedicated to the furthering of Free Software, defined by the freedoms to use, study, modify and copy. Independent of the issue of commercial exploitation, it is proprietary, freedom-diminishing licensing that works against the interests of people and society at large, which is therefore rejected by FSFE.'
+ 'The purpose of this agreement is to ensure the lasting protection of Free Software by making FSFE the fiduciary of the author\'s interests.\n It empowers FSFE -- and its sister organisations -- to uphold the interests of Free Software authors and protect them in court, if necessary.'
+ 'FSFE is given the right to relicense the software as necessary for the long-term legal maintainability and protection of the software. The agreement also grants the author an unlimited amount of non-exclusive licences by FSFE, which allow using and distributing the program in other projects and under other licences.'
+ 'The contracting parties sign the following agreement in full consciousness that by the grant of exclusive licence to the Free Software Foundation Europe e.V. and by the administration of these rights the FSFE becomes trustee of the author\'s interests for the benefit of Free Software.';

var shortUrl            = '';
var query4form          = '';
var query4form_short    = '';

var dictionary = {
    'traditional':              'Traditional Patent License',
    'Traditional':              'Traditional Patent License',
    'patent-pledge':            'Patent Pledge',
    'Patent-Pledge':            'Patent Pledge',
    'non-exclusive':            'Non-Exclusive',
    'exclusive':                'Exclusive',
};

/**
 *
 * Query String Possible Parameters:
 *
 * beneficiary-name=STRING
 * project-name=STRING
 * project-website=URL
 * project-email=EMAIL
 * process-url=URL
 * project-jurisdiction=STRING
 *
 * fsfe-compliance=fsfe-compliance|non-fsfe-compliance FIXME: check for consistency and implement non-fsfe-compliance properly
 * agreement-exclusivity=exclusive|non-exclusive
 * outbound-option=fsfe|same-licenses|license-policy|same|no-commitment
 * outboundlist=Artistic-1.0,Apache-2.0,LIST
 * outboundlist-custom=STRING
 * license-policy-location=STRING
 * medialist=None|GFDL-1.1|CC-BY-1.0,GFDL-1.3,LIST
 * patent-option=Traditional|Patent-Pledge  // TODO why are these uppercase
 *
 * your-name=STRING
 * your-date=STRING
 * your-title=STRING
 * your-address=STRING
 * your-patents=STRING
 * pos=general|copyright|patents|review|apply
 * action=sign-individual|sign-entity|sign-fla
 */

/*
 * These should basically be the same as the query parameters described above.
 */

var configs = {
    'beneficiary-name':           '',
    'project-name':               '',
    'project-website':            '',
    'project-email':              '',
    'process-url':                '',
    'project-jurisdiction':       '',
    'fsfe-compliance':            '',
    'agreement-exclusivity':      '',
    'outbound-option':            '',
    'outboundlist':               '',
    'outboundlist-custom':        '',
    'license-policy-location':    '',
    'medialist':                  '',
    'patent-option':              '',
    'your-name':                  '',
    'your-date':                  '',
    'your-title':                 '',
    'your-address':               '',
    'your-patents':               '',
    'pos':                        'apply',
    'action':                     ''
};


function printConfigs ()
{
    // make query string url
    $.each( configs, function(p,v){
        console.log("configs(p,v): " + p + ": \t\t\t\t\t\t\t " + v);
    });
}

// gives us $.QueryString["parameter-name"] function
(function ($) {
    $.QueryString = (function (a) {
    if (a == "") return {};
        var b = {};
        for (var i = 0; i < a.length; ++i) {
            var p = a[i].split('=');
            if (p.length != 2) continue;
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
        return b;
    })(window.location.search.substr(1).split('&'))
})(jQuery);


function htmlEscape(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/* Convert to markdown */
function toMarkdown(node) {
    var turndownService = new TurndownService({headingStyle: 'atx'})
    turndownService.addRule('listItem', {
      filter: 'li',

      replacement: function (content, node, options) {
        content = content
          .replace(/^\n+/, '') // remove leading newlines
          .replace(/\n+$/, '\n') // replace trailing newlines with just a single one
          .replace(/\n/gm, '\n    '); // indent
        var prefix = options.bulletListMarker + ' ';
        var parent = node.parentNode;
        if (parent.nodeName === 'OL') {
          var start = parent.getAttribute('start');
          var index = Array.prototype.indexOf.call(parent.children, node);
          prefix = (start ? Number(start) + index : index + 1) + '. ';
        }
        return (
          prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '')
        );
      }
    });
    var markdown = turndownService.turndown(node)
    return markdown
}

/**
 * Cleanup of the query string data and setting it.
 * @usage: http://cla.fabricatorz.com/?beneficiary-name=Fabricatorz&project-name=Archive%20Software&project-website=http://archive.fabricatorz.com&project-email=jon@fabricatorz.com&process-url=http://archive.fabricatorz.com/signing&project-jurisdiction=United%20States,%20Hong%20Kong,%20and%20China%20Mainland
 *
 */
function queryStringToConfigs ()
{
    $.each( $.QueryString, function(p,v) {
        configs[p] = v;
        if ( doDebug )
            console.log("configs[p]=v: " + configs[p] + ": " + p + ": " + v);
    });

}

/**
 * This  function take the config values (for example when derived from a url) and update the app/UI accordingly
 */
function updateConfigs ()
{

    /* general */

    if ( configs["beneficiary-name"] )
        $('#beneficiary-name').val( configs["beneficiary-name"] );
    if ( doDebug )
        console.log("beneficiary-name: " + configs["beneficiary-name"]);

    if ( configs["project-name"] )
        $('#project-name').val( configs["project-name"] );
    if ( doDebug )
        console.log("project-name: " + configs["project-name"]);

    if ( configs["project-website"] )
        $('#project-website').val( configs["project-website"] );
    if ( doDebug )
        console.log("project-website: " + configs["project-website"]);

    if ( configs["project-email"] )
        $('#project-email').val( configs["project-email"] );
    if ( doDebug )
        console.log("project-email: " + configs["project-email"]);

    if ( configs["project-jurisdiction"] )
        $('#project-jurisdiction').val( configs["project-jurisdiction"] );
    if ( doDebug )
        console.log("project-jurisdiction: " +
            configs["project-jurisdiction"]);

    /* fsfe compliance changes */
    if ( configs["fsfe-compliance"] == "fsfe-compliance" ) {
      $('#fsfe-compliance').val(configs["fsfe-compliance"] );
        $('#non-fsfe-compliance').val('');
        $('#fsfe-compliance').addClass('active');
        $('#non-fsfe-compliance').removeClass('active');
    } else {
        $('#fsfe-compliance').val('');
        $('#non-fsfe-compliance').val(configs["fsfe-compliance"] );
        $('#non-fsfe-compliance').addClass('active');
        $('#fsfe-compliance').removeClass('active');
    }
    if ( doDebug )
        console.log("fsfe-compliance: " +
            configs["fsfe-compliance"]);

    /* copyright */
    if ( configs["agreement-exclusivity"] == 'exclusive' )
        $("#agreement-exclusivity").val( 'exclusive' );
    else
        $("#agreement-exclusivity").val( 'non-exclusive' );
    if ( doDebug )
        console.log("agreement-exclusivity: " +
            configs["agreement-exclusivity"]);

    // hide by default
    $("#outboundlist").hide();
    $("#outboundlist-custom").hide();

    // The following switch statement activates the respective UI options based on config options
    switch ( configs["outbound-option"] ) {
        // option-1
        case 'fsfe':
          $("#outbound-option-fsfe").prop('checked', true );
          $("#outbound-option-fsfe" ).trigger( 'change' );
          // @todo delete later if no need
          // setOutboundOptionFsfe();
          break;
        // option-2
        case 'same-licenses':
            $("#outbound-option-same-licenses").prop('checked', true );
            $("#outbound-option-same-licenses" ).change();
            // @todo delete later if no need
            // setOutboundOptionSameLicenses();
            $("#outboundlist").show();
            $("#outboundlist-custom").show();
            break;
        // option-3
        case 'license-policy':
            $("#outbound-option-license-policy").prop('checked', true);
            $("#outbound-option-license-policy").change();
            $("#license-policy-location").show();
            $("#license-policy-location" ).val( configs["license-policy-location"] );
            break;
        // option-4
        case 'same':
        default:
            $("#outbound-option-same").prop('checked', true );
            $("#outbound-option-same" ).trigger( 'change' );
            // @todo delete later if no need
            // setOutboundOptionSame();
        // option-5
        case 'no-commitment':
            $("#outbound-option-no-commitment").prop('checked', true );
            $("#outbound-option-no-commitment" ).trigger( 'change' );
            // @todo delete later if no need
            // setOutboundOptionNoCommitment();
            break;
    }

    if ( doDebug )
        console.log("outbound-option: " + configs["outbound-option"]);


    if ( configs["outboundlist"] )
    {
        $.each( configs["outboundlist"].split(","), function(i,e) {
            $("#outboundlist option[value='" + e + "']").prop("selected", true);
        });
    }
    if ( doDebug )
        console.log("outboundlist: " +
            configs["outboundlist"]);

    if ( configs["outboundlist-custom"] )
        $("#outboundlist-custom" ).val( configs["outboundlist-custom"] );
    if ( doDebug )
        console.log("outboundlist-custom: " +
            configs["outboundlist-custom"]);

    $("#medialist option[value='None']").prop("selected", false);
    if ( configs["medialist"] )
    {
        $.each( configs["medialist"].split(","), function(i,e){
            $("#medialist option[value='" + e + "']").prop("selected", true);
        });
    }
    if ( doDebug )
        console.log("medialist: " + configs["medialist"]);

    /* patent page */
    if ( configs["patent-option"] == 'Traditional' )
        $("#patent-type").val( 'Traditional' );
    else
        $("#patent-type").val( 'Patent-Pledge' );
    if ( doDebug )
        console.log("patent-option: " + configs["patent-option"] );

    /* signer assignment */
    if ( configs["your-date"] )
    {
       var ourDate = new Date(configs["your-date"]*1000 );

       $("#tmp-signing-you-date").html( ourDate );
    }
    if ( configs["your-name"] )
    {
       $("#tmp-signing-you-name").html( configs["your-name"] );
    }
    if ( configs["your-title"] )
    {
       $("#tmp-signing-you-title").html( configs["your-title"] );
    }
    if ( configs["your-address"] )
    {
       $("#tmp-signing-you-address").html( configs["your-address"] );
    }
    if ( configs["your-patents"] )
    {
       $('#review-text #tmp-patent-more').html( nl2br( configs["your-patents"],true) );
       $('#review-text-entity #tmp-patent-more').html( nl2br( configs["your-patents"],true) );
    }
    // let's assume one signed this, but didn't input any patents
    if ( configs["your-name"] && ! configs["your-patents"] )
    {
       $('#review-text #tmp-patent-more').html( noneField );
       $('#review-text-entity #tmp-patent-more').html( noneField );
    }

    // tmp-submission-instructions
    if ( configs["process-url"] )
    {
       console.log( configs["process-url"] );
       $("#contributor-process-url").val( configs["process-url"] );
       $("#tmp-submission-instructions").html( configs["process-url"] );
    }


    if ( doDebug )
        printConfigs();

}

/*
 * This function loads the agreement template
 */

function loadTemplates ()
{
    $.ajax('agreement-template-unified.html', {
        timeout: 1000,
        async: false,
        success: function(resp) {
            $('#review-text').html(resp);
            if ( doDebug )
                console.log("f-sign-indy: " +  $("#review-text").html() );
            $('#review-text-entity').html(resp);
            if ( doDebug )
                console.log("f-sign-entity: " +  $("#review-text-entity").html() );
            $('#review-text-fla').html(resp);
            if ( doDebug )
                console.log("f-sign-fla: " +  $("#review-text-fla").html() );
            $('#review-text-fla-entity').html(resp);
            if ( doDebug )
                console.log("f-sign-fla-entity: " +  $("#review-text-fla-entity").html() );
        }
    });
    $.ajax('agreement-style.html', {
        timeout: 1000,
        async: false,
        success: function(resp) {
            $('#review-text-style').html(resp);
            if ( doDebug )
                console.log("f-review-text-style: " +
                    $("#review-text-style").html() );
        }
    });

}

/**
 * This function set fake test data. Once external tests are up, this should be removed. Or in any case refactored.
 */

function setFakeData ()
{
    configs['beneficiary-name']         = 'Fabricatorz';
    configs['project-name']             = 'Archive Software';
    configs['project-website']           = 'https://archive.fabricatorz.com';
    configs['project-email']             = 'jon@fabricatorz.com';
    configs['process-url']   =
        'https://archive.fabricatorz.com/signing';
    configs['project-jurisdiction']      =
        'United States, Hong Kong, and China Mainland.';
}

/*
* This function converts new lines into break tags (only used for "your-patents" list
*/

function nl2br (str, is_xhtml)
{
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ?
    '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' +
        breakTag + '$2');
}

/*
 * This function retrieves a shorturl from the u2s service. actions are set/get, and parameters f.e. l like here or a to return the url
 */

function getShortUrl(uri)
{
    var result = '';
    if ( doDebug ) {
        result = "testing"
    } else {
    $.ajax({
        url: urlShortener + '/set/?l=' + uri,
        async: false,
        success: function(data) { result = data; }
    });
    }
    return result;
}

/*
 * This generates the query for the e-signing form. Runs at serviceurl/query2form
 */

function updateQuery4Form ()
{
    var projectemail = ( configs["project-email"] ) ? configs["project-email"] : "";
    // if need to debug, remove the '&@u2s' which converts to short url
    var signerFmt    = encodeURIComponent(shortUrl +
        '?your-date=@_time&your-name=@fullname&your-title=@title&' +
        'your-address=@email-address&your-patents=@Patent-IDs-and-Country_t&'+
        'process-url=@_processurl&' +
        'action=sign-@agreement-type&@u2s');

    query4form = serviceUrl + '/query2form/?' +
        '_replyto=' + projectemail + '&' +
        '_subject=Contributor License Agreement E-Signing' + '&' +
        '_body=Fill out the following form, then sign your initials to complete the Contributor License Agreement.' + '&' +
        'agreement-type[]=individual&agreement-type[]=entity&' +
        'fullname=&' +
        'title=&' +
        'company=&' +
        'email-address=&' +
        'physical-address=&' +
        ( ( $( "#patent-type" ).val() == 'Patent-Pledge' ) ?
            'Patent-IDs-and-Country_t=&_id=patent-pledge&' : '') +
        'your-initials=&' +
        ( ( "" != shortUrl ) ? 'original-agreement=' + shortUrl + '&' : '' ) +
        'signed-agreement_s=' + signerFmt + '&' +
        '_processurl=@processurl&' +
        '_action[0]=' + serviceUrl + '/query2email/&' +
        '_action[1]=' + serviceUrl + '/query2update/&' +
        '_next=View%20More%20Contributor%20License%20Agreement%20Signers.&' +
        '_success=Thank you for using contributoragreements.org. The agreement has been signed and sent via E-Mail and will not be stored.&' +
        '_submit=Sign Your Contributor License Agreement.';

        var encoded_query_form_uri = encodeURIComponent(query4form);
        query4form_short = getShortUrl(encoded_query_form_uri);

}

/*
 * Utility function to set the first char in a string to uppercase
 */

function ucFirst(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/*
 * Utility function to set words in a string to uppercase
 */

function ucWords(string) {
    return (string + '').
        replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g,
            function($1) {
                return $1.toUpperCase();
            });
}

/*
 * Utility function for crude email validation.
 */

function validateEmail(email)
{
        var re = /\S+@\S+\.\S+/;
            return re.test(email);
}

/*
 * Utility function for URL validation
 */

function validateURL(textval) {
          var urlregex = new RegExp(
                      "^(http|https|ftp)\://([a-zA-Z0-9\.\-]+(\:[a-zA-Z0-9\.&amp;%\$\-]+)*@)*((25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])|([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(\:[0-9]+)*(/($|[a-zA-Z0-9\.\,\?\'\\\+&amp;%\$#\=~_\-]+))*$");
                return urlregex.test(textval);
}

/*
 * Utility function to inspect an object
 * (not used as far as I can tell)
 */

function oinspect (obj)
{
    var str = "";
    for(var k in obj)
        if (obj.hasOwnProperty(k))
            str += k + " = " + obj[k] + "\n";

    alert(str);
}

/*
 * Adjusts the patent paragraph depending on "messsage
 * Adds "the following " + licenses + " licenses" or "the license that we are using on the submission date" into the #review-text and #review-text-emtity
 */

function fixPatentParagraph( message )
{
    if ( typeof message == 'undefined' )
        /*Probably never invoked until now, because message never "undefined".*/
        message = outBeforeField + " " +
                  $("#tmp-licenses-2").html() + " " +
                  outAfterField;

     $('#review-text #tmp-licenses-2').html( message );
    $('#review-text-entity #tmp-licenses-2').html( message );
}

/*
 * This generates embedding code with the query put in.
 */

function getEmbedCode ( ourQuery )
{
    return htmlEscape(
    '<iframe id="e-sign-process" src="' + ourQuery +
    '" width="100%" height="100%"></iframe>'
    );
}

/*
 * This function renumbers the relevant sections. Specifically necessary after removing or adding sections, but right probably ddone all the time to be sure. FIXME is it really necessary?
 */

function putBackOrderOfSectionsAfterSection4 ()
{
    $('#review-text #tmp-digit-disclaimer').html( '5.' );
    $('#review-text #tmp-digit-waiver').html( '6.' );
    $('#review-text #tmp-digit-approx-waiver').html( '7.' );
    $('#review-text #tmp-digit-disclaimer-2').html( '5.' );
    $('#review-text #tmp-digit-waiver-2').html( '6.' );
    $('#review-text #tmp-digit-term').html( '8.' );
    $('#review-text #tmp-digit-term-1').html( '8.1' );
    $('#review-text #tmp-digit-term-2').html( '8.2' );
    $('#review-text #tmp-digit-term-3').html( '8.3' );
    $('#review-text #tmp-digit-term-special').html( '5, 6, 7, 8 and 9' );
    $('#review-text #tmp-digit-misc').html( '9' );
    $('#review-text #tmp-digit-misc-1').html( '9.1' );
    $('#review-text #tmp-digit-misc-2').html( '9.2' );
    $('#review-text #tmp-digit-misc-3').html( '9.3' );
    $('#review-text #tmp-digit-misc-4').html( '9.4' );
    $('#review-text #tmp-digit-misc-5').html( '9.5' );

    $('#review-text-entity #tmp-digit-disclaimer').html( '5.' );
    $('#review-text-entity #tmp-digit-waiver').html( '6.' );
    $('#review-text-entity #tmp-digit-approx-waiver').html( '7.' );
    $('#review-text-entity #tmp-digit-disclaimer-2').html( '5.' );
    $('#review-text-entity #tmp-digit-waiver-2').html( '6.' );
    $('#review-text-entity #tmp-digit-term').html( '8.' );
    $('#review-text-entity #tmp-digit-term-1').html( '8.1' );
    $('#review-text-entity #tmp-digit-term-2').html( '8.2' );
    $('#review-text-entity #tmp-digit-term-3').html( '8.3' );
    $('#review-text-entity #tmp-digit-term-special').html( '5, 6, 7, 8 and 9' );
    $('#review-text-entity #tmp-digit-misc').html( '9' );
    $('#review-text-entity #tmp-digit-misc-1').html( '9.1' );
    $('#review-text-entity #tmp-digit-misc-2').html( '9.2' );
    $('#review-text-entity #tmp-digit-misc-3').html( '9.3' );
    $('#review-text-entity #tmp-digit-misc-4').html( '9.4' );
    $('#review-text-entity #tmp-digit-misc-5').html( '9.5' );

    // FIXME this is never hidden as das as I can tell, so could maybe be removed
    $('#review-text #tmp-term-special').show();
    $('#review-text #tmp-term-special').removeClass("nuke");
    $('#review-text-entity #tmp-term-special').show();
    $('#review-text-entity #tmp-term-special').removeClass("nuke");
}

/*
* This sets the outbound options as compatible with the FSFE FLA, or compatible with licenses sanctioned by the FSF or OSI.
*/

function setOutboundOptionFsfe ()
{
    $("#review-outbound-licenses").html(
        $("#outbound-option-fsfe").val() );

    configs['outbound-option'] = 'fsfe' ;

    // ensures that the outbound section is shown.
    $('#review-text-fla #tmp-outbound-section-all').show();
    $('#review-text-fla #tmp-outbound-section-all').removeClass("nuke");
    $('#review-text-fla-entity #tmp-outbound-section-all').show();
    $('#review-text-fla-entity #tmp-outbound-section-all').removeClass("nuke");
    $('#review-text #tmp-outbound-section-all').show();
    $('#review-text #tmp-outbound-section-all').removeClass("nuke");
    $('#review-text-entity #tmp-outbound-section-all').show();
    $('#review-text-entity #tmp-outbound-section-all').removeClass("nuke");
    // inserts the fsfe field into #tmp-outbound-special which manages patents necessary for the license
    $('#review-text #tmp-licenses-2').html( fsfeField );
    $('#review-text-entity #tmp-licenses-2').html( fsfeField );

    /* put back order of sections after section 4 */
    putBackOrderOfSectionsAfterSection4();
    // Enables outbound option 1 for all cla/fla indiv/entity (outbound under FSF sanctioned licenses)
    $('#review-text-fla #tmp-outbound-option-1-fsfe').show();
    $('#review-text-fla #tmp-outbound-option-1-fsfe').removeClass("nuke");
    $('#review-text-fla-entity #tmp-outbound-option-1-fsfe').show();
    $('#review-text-fla-entity #tmp-outbound-option-1-fsfe').removeClass("nuke");
    $('#review-text #tmp-outbound-option-1-fsfe').show();
    $('#review-text #tmp-outbound-option-1-fsfe').removeClass("nuke");
    $('#review-text-entity #tmp-outbound-option-1-fsfe').show();
    $('#review-text-entity #tmp-outbound-option-1-fsfe').removeClass("nuke");

    // Disable outbound option 2 fsfe compliant (List of licenses)
    $('#review-text-fla #tmp-outbound-option-2-fsfe').hide();
    $('#review-text-fla #tmp-outbound-option-2-fsfe').addClass("nuke");
    $('#review-text-fla-entity #tmp-outbound-option-2-fsfe').hide();
    $('#review-text-fla-entity #tmp-outbound-option-2-fsfe').addClass("nuke");
    $('#review-text #tmp-outbound-option-2-fsfe').hide();
    $('#review-text #tmp-outbound-option-2-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-2-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-2-fsfe').addClass("nuke");

    // Disable outbound option 2 non-fsfe-compliant ("List of licenses")
    $('#review-text-fla #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text-fla #tmp-outbound-option-2-non-fsfe').addClass("nuke");
    $('#review-text-fla-entity #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text-fla-entity #tmp-outbound-option-2-non-fsfe').addClass("nuke");
    $('#review-text #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text #tmp-outbound-option-2-non-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-2-non-fsfe').addClass("nuke");

    // Disable outbound option 3 (licensing policy) (this is the same for fsfe and non-fsfe, so there is no option-4-non-fsfe)
    $('#review-text-fla #tmp-outbound-option-3-fsfe').hide();
    $('#review-text-fla #tmp-outbound-option-3-fsfe').addClass("nuke");
    $('#review-text-fla-entity #tmp-outbound-option-3-fsfe').hide();
    $('#review-text-fla-entity #tmp-outbound-option-3-fsfe').addClass("nuke");
    $('#review-text #tmp-outbound-option-3-fsfe').hide();
    $('#review-text #tmp-outbound-option-3-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-3-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-3-fsfe').addClass("nuke");

    // Disable option 4 (same license(s) as used on the submission date)
    $('#review-text-fla #tmp-outbound-option-4-non-fsfe').hide();
    $('#review-text-fla #tmp-outbound-option-4-non-fsfe').addClass("nuke");
    $('#review-text-fla-entity #tmp-outbound-option-4-non-fsfe').hide();
    $('#review-text-fla-entity #tmp-outbound-option-4-non-fsfe').addClass("nuke");
    $('#review-text #tmp-outbound-option-4-non-fsfe').hide();
    $('#review-text #tmp-outbound-option-4-non-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-4-non-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-4-non-fsfe').addClass("nuke");
}

/*
 * This sets the outbound options for the same-license option, meaning the licenses specified from a list or custom text field.
 */

function setOutboundOptionSameLicenses ()
{
    // sets the requisite config option
    configs['outbound-option'] = 'same-licenses';

    // enables the outbound section in the template
    $("#tmp-outbound-section-all").show();
    $("#tmp-outbound-section-all").removeClass("nuke");
    // insert the specific licenses into the UI
    $("#review-outbound-licenses").html( outboundCopyrightLicenses );
    // insert the specific licenses into the template
    $('#review-text #tmp-licenses').html( outboundCopyrightLicenses );
    $('#review-text #tmp-licenses-2').html( outboundCopyrightLicenses );
    // insert the specific licenses into the entity template
    $('#review-text-entity #tmp-licenses').html( outboundCopyrightLicenses );
//    $('#review-text-entity #tmp-licenses-2').html( outboundCopyrightLicenses ); FIXME check, b/c I think this does not exist
    // set the config options for the license list
    configs['outboundlist'] = outboundCopyrightLicenses;

    /* put back order of sections after section 4 */
    putBackOrderOfSectionsAfterSection4();

    // this if else inserts the requisite patent license paragraph
    if ( !outboundCopyrightLicenses )
    {
        fixPatentParagraph( outBeforeField + " " +
                            outAfterField + " " + emptyField );
    } else {
        fixPatentParagraph();
    }
    // for fsfe-fla, enable and disable the requisite copyright options
    if ( $("#fsfe-compliance").hasClass('active') )
    {
        // in this case, paragraph 1 and 2 of outbound license obligations are enabled
        $('#review-text-fla #tmp-outbound-option-1-fsfe').show();
        $('#review-text-fla #tmp-outbound-option-1-fsfe').removeClass("nuke");
        $('#review-text-fla #tmp-outbound-option-2-fsfe').show();
        $('#review-text-fla #tmp-outbound-option-2-fsfe').removeClass("nuke");
        $('#review-text-fla #tmp-outbound-option-2-non-fsfe').hide();
        $('#review-text-fla #tmp-outbound-option-2-non-fsfe').addClass("nuke");
        $('#review-text-fla #tmp-outbound-option-3-fsfe').hide();
        $('#review-text-fla #tmp-outbound-option-3-fsfe').addClass("nuke");
        $('#review-text-fla #tmp-outbound-option-4-non-fsfe').hide();
        $('#review-text-fla #tmp-outbound-option-4-non-fsfe').addClass("nuke");
        // the same for the entity version
        $('#review-text-fla-entity #tmp-outbound-option-1-fsfe').show();
        $('#review-text-fla-entity #tmp-outbound-option-1-fsfe').removeClass("nuke");
        $('#review-text-fla-entity #tmp-outbound-option-2-fsfe').show();
        $('#review-text-fla-entity #tmp-outbound-option-2-fsfe').removeClass("nuke");
        $('#review-text-fla-entity #tmp-outbound-option-2-non-fsfe').hide();
        $('#review-text-fla-entity #tmp-outbound-option-2-non-fsfe').addClass("nuke");
        $('#review-text-fla-entity #tmp-outbound-option-3-fsfe').hide();
        $('#review-text-fla-entity #tmp-outbound-option-3-fsfe').addClass("nuke");
        $('#review-text-fla-entity #tmp-outbound-option-4-non-fsfe').hide();
        $('#review-text-fla-entity #tmp-outbound-option-4-non-fsfe').addClass("nuke");
    // for cla, disable the fsfe options and enable others
    } else { // option 1
        $('#review-text #tmp-outbound-option-1-fsfe').hide();
        $('#review-text #tmp-outbound-option-1-fsfe').addClass("nuke");
        $('#review-text-entity #tmp-outbound-option-1-fsfe').hide();
        $('#review-text-entity #tmp-outbound-option-1-fsfe').addClass("nuke");
        // option 2
        $('#review-text #tmp-outbound-option-2-fsfe').hide();
        $('#review-text #tmp-outbound-option-2-fsfe').addClass("nuke");
        $('#review-text-entity #tmp-outbound-option-2-fsfe').hide();
        $('#review-text-entity #tmp-outbound-option-2-fsfe').addClass("nuke");
        // enable option 2 non-fsfe
        $('#review-text .tmp-outbound-option-2-non-fsfe').show();
        $('#review-text .tmp-outbound-option-2-non-fsfe').removeClass("nuke");
        $('#review-text-entity .tmp-outbound-option-2-non-fsfe').show();
        $('#review-text-entity .tmp-outbound-option-2-non-fsfe').removeClass("nuke");
        // disable option 3 (there is only one for fsfe, no non-fsfe one)
        $('#review-text #tmp-outbound-option-3-fsfe').hide();
        $('#review-text #tmp-outbound-option-3-fsfe').addClass("nuke");
        $('#review-text-entity #tmp-outbound-option-3-fsfe').hide();
        $('#review-text-entity #tmp-outbound-option-3-fsfe').addClass("nuke");
        // disable option 4
        $('#review-text #tmp-outbound-option-4-non-fsfe').hide();
        $('#review-text #tmp-outbound-option-4-non-fsfe').addClass("nuke");
        $('#review-text-entity #tmp-outbound-option-4-non-fsfe').hide();
        $('#review-text-entity #tmp-outbound-option-4-non-fsfe').addClass("nuke");
    }
}

/*
* This function sets the outbound option to license-policy.
*/

  function setOutboundOptionLicensePolicy ()
{
    configs['outbound-option'] = 'license-policy';
    if ( !!$('#license-policy-location').val() ) {
    configs['license-policy-location'] = $("#license-policy-location").val();
    }
    // sets the value of the license policy on the review tab to the value of the input on the copyright tab
    $("#review-outbound-licenses").html(
      $("#outbound-option-license-policy").val() );
    // enable outbound paragraph 1
    $('#review-text-fla #tmp-outbound-option-1-fsfe').show();
    $('#review-text-fla #tmp-outbound-option-1-fsfe').removeClass("nuke");
    $('#review-text-fla-entity #tmp-outbound-option-1-fsfe').show();
    $('#review-text-fla-entity #tmp-outbound-option-1-fsfe').removeClass("nuke");
    $('#review-text #tmp-outbound-option-1-fsfe').show();
    $('#review-text #tmp-outbound-option-1-fsfe').removeClass("nuke");
    $('#review-text-entity #tmp-outbound-option-1-fsfe').show();
    $('#review-text-entity #tmp-outbound-option-1-fsfe').removeClass("nuke");
    // disables outbound option 2 fsfe
    $('#review-text-fla #tmp-outbound-option-2-fsfe').hide();
    $('#review-text-fla #tmp-outbound-option-2-fsfe').addClass("nuke");
    $('#review-text-fla-entity #tmp-outbound-option-2-fsfe').hide();
    $('#review-text-fla-entity #tmp-outbound-option-2-fsfe').addClass("nuke");
    $('#review-text #tmp-outbound-option-2-fsfe').hide();
    $('#review-text #tmp-outbound-option-2-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-2-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-2-fsfe').addClass("nuke");
    // disables outbound paragraph 2 non-fsfe
    $('#review-text-fla #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text-fla #tmp-outbound-option-2-non-fsfe').addClass("nuke");
    $('#review-text-fla-entity #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text-fla-entity #tmp-outbound-option-2-non-fsfe').addClass("nuke");
    $('#review-text #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text #tmp-outbound-option-2-non-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-2-non-fsfe').addClass("nuke");
    // enable and show outbound option 3 (license policy) (there is no non-fsfe one)
    $('#review-text-fla #tmp-outbound-option-3-fsfe').show();
    $('#review-text-fla #tmp-outbound-option-3-fsfe').removeClass("nuke");
    $('#review-text-fla-entity #tmp-outbound-option-3-fsfe').show();
    $('#review-text-fla-entity #tmp-outbound-option-3-fsfe').removeClass("nuke");
    $('#review-text #tmp-outbound-option-3-fsfe').show();
    $('#review-text #tmp-outbound-option-3-fsfe').removeClass("nuke");
    $('#review-text-entity #tmp-outbound-option-3-fsfe').show();
    $('#review-text-entity #tmp-outbound-option-3-fsfe').removeClass("nuke");
    // insert the license policy location into the text, from the input field. LicensePolicyLocation is populated in testCopyrightPage
    $('#review-text-fla #tmp-license-policy-location').html( LicensePolicyLocation );
    $('#review-text-fla-entity #tmp-license-policy-location').html( LicensePolicyLocation );
    $('#review-text #tmp-license-policy-location').html( LicensePolicyLocation );
    $('#review-text-entity #tmp-license-policy-location').html( LicensePolicyLocation );
    // disable outbound option 4
    $('#review-text-fla #tmp-outbound-option-4-non-fsfe').hide();
    $('#review-text-fla #tmp-outbound-option-4-non-fsfe').addClass("nuke");
    $('#review-text-fla-entity #tmp-outbound-option-4-non-fsfe').hide();
    $('#review-text-fla-entity #tmp-outbound-option-4-non-fsfe').addClass("nuke");
    $('#review-text #tmp-outbound-option-4-non-fsfe').hide();
    $('#review-text #tmp-outbound-option-4-non-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-4-non-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-4-non-fsfe').addClass("nuke");
    // insert fsfeField into special outbound paragraph (#tmp-outbound-special) for patent licensing (promise to only license patents in so far as necessary for sublicensing and combination under specified licenses
    $('#review-text #tmp-licenses-2').html( fsfeField );
    $('#review-text-entity #tmp-licenses-2').html( fsfeField );

    /* put back order of sections after section 4 */
    putBackOrderOfSectionsAfterSection4();
}

/*
 * Sets the outbound copyright option to the same license (as used on the submission date)
 */

function setOutboundOptionSame ()
{
    /* remove the outbound-option in review */
    $("#review-outbound-licenses").html(
        $("#outbound-option-same").val() );
    configs['outbound-option'] = 'same';

    // enable the outbound section
    $("#tmp-outbound-section-all").show();
    $("#tmp-outbound-section-all").removeClass("nuke");
    // set the extra field in the outbound-special section to empty
    $('#review-text #tmp-licenses-2').html( emptyField );
    $('#review-text-entity #tmp-licenses-2').html( emptyField );

    /* put back order of sections after section 4 */
    putBackOrderOfSectionsAfterSection4();
    // inserts into tmp-outbound-special
    fixPatentParagraph( 'the license or licenses that We ' +
                        'are using on the Submission Date' );
    // disable outbound option 1
    $('#review-text #tmp-outbound-option-1-fsfe').hide();
    $('#review-text #tmp-outbound-option-1-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-1-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-1-fsfe').addClass("nuke");
    // disable outbound option 2 fsfe
    $('#review-text #tmp-outbound-option-2-fsfe').hide();
    $('#review-text #tmp-outbound-option-2-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-2-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-2-fsfe').addClass("nuke");
    // disable outbound option 2 non-fsfe
    $('#review-text #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text #tmp-outbound-option-2-non-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-2-non-fsfe').addClass("nuke");
    // disable outbound option 3
    $('#review-text #tmp-outbound-option-3-fsfe').hide();
    $('#review-text #tmp-outbound-option-3-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-3-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-3-fsfe').addClass("nuke");
    // enable outbound option 4
    $('#review-text #tmp-outbound-option-4-non-fsfe').show();
    $('#review-text #tmp-outbound-option-4-non-fsfe').removeClass("nuke");
    $('#review-text-entity #tmp-outbound-option-4-non-fsfe').show();
    $('#review-text-entity #tmp-outbound-option-4-non-fsfe').removeClass("nuke");
}

/*
 * This sets the outbound options so that no commitment for any specific licenses is defined
 */

function setOutboundOptionNoCommitment ()
{
    /* remove the outbound-option in review */
    $("#review-outbound-licenses").html( naField );
    $("#review-media-licenses").html( naField );

    configs['outbound-option'] = 'no-commitment';

    /* remove entire section 4 */
    $('.tmp-outbound-section').hide();
    $('.tmp-outbound-section').addClass("nuke");

    /* reorder sections now that section 4 gone */
    $('#review-text #tmp-digit-disclaimer').html( '4.' );
    $('#review-text #tmp-digit-waiver').html( '5.' );
    $('#review-text #tmp-digit-approx-waiver').html( '6.' );
    $('#review-text #tmp-digit-disclaimer-2').html( '4.' );
    $('#review-text #tmp-digit-waiver-2').html( '5.' );
    $('#review-text #tmp-digit-term').html( '7.' );
    $('#review-text #tmp-digit-term-1').html( '7.1' );
    // 7.2 is removed
    //$('#review-text #tmp-digit-term-2').html( '7.2' );
    $('#review-text #tmp-digit-term-3').html( '7.2' );
    $('#review-text #tmp-digit-term-special').html( '4, 5, 6, 7 and 8' );
    $('#review-text #tmp-digit-misc').html( '8' );
    $('#review-text #tmp-digit-misc-1').html( '8.1' );
    $('#review-text #tmp-digit-misc-2').html( '8.2' );
    $('#review-text #tmp-digit-misc-3').html( '8.3' );
    $('#review-text #tmp-digit-misc-4').html( '8.4' );
    $('#review-text #tmp-digit-misc-5').html( '8.5' );
    // the same for the entity text
    $('#review-text-entity #tmp-digit-disclaimer').html( '4.' );
    $('#review-text-entity #tmp-digit-waiver').html( '5.' );
    $('#review-text-entity #tmp-digit-approx-waiver').html( '6.' );
    $('#review-text-entity #tmp-digit-disclaimer-2').html( '4.' );
    $('#review-text-entity #tmp-digit-waiver-2').html( '5.' );
    $('#review-text-entity #tmp-digit-term').html( '7.' );
    $('#review-text-entity #tmp-digit-term-1').html( '7.1' );
    // section 7.2 is removed
    //$('#review-text-entity #tmp-digit-term-2').html( '7.2' );
    $('#review-text-entity #tmp-digit-term-3').html( '7.2' );
    $('#review-text-entity #tmp-digit-term-special').html( '4, 5, 6, 7 and 8' );
    $('#review-text-entity #tmp-digit-misc').html( '8' );
    $('#review-text-entity #tmp-digit-misc-1').html( '8.1' );
    $('#review-text-entity #tmp-digit-misc-2').html( '8.2' );
    $('#review-text-entity #tmp-digit-misc-3').html( '8.3' );
    $('#review-text-entity #tmp-digit-misc-4').html( '8.4' );
    $('#review-text-entity #tmp-digit-misc-5').html( '8.5' );
    // set reference to termination clause properly after removing section 4
    $('#review-text #tmp-contributor-termination-reference').html('7.2');
    $('#review-text-entity #tmp-contributor-termination-reference').html('7.2');
    // hide special term-special section
    $('#review-text #tmp-term-special').hide();
    $('#review-text #tmp-term-special').addClass("nuke");
    $('#review-text-entity #tmp-term-special').hide();
    $('#review-text-entity #tmp-term-special').addClass("nuke");
}

/*
 * This adjust the chooser position, based on the pos argument to the query string.
 */

function updatePosition ()
{
    switch ( $.QueryString["pos"] ) {
        case 'general':
            $('#rootwizard').bootstrapWizard('show','general');
            break;
        case 'copyright':
            testCopyrightPage();
            $('#rootwizard').bootstrapWizard('show',1);
            break;
        case 'patents':
            testPatentPage();
            $('#rootwizard').bootstrapWizard('show',2);
            break;
        case 'review':
            testReviewPage();
            $('#rootwizard').bootstrapWizard('show',3);
            break;
        case 'apply':
            // loadTemplates();
            testAllPages();
            $('#rootwizard').bootstrapWizard('last');
            break;
    }
    // testAllPages();
    if ( doDebug)
        console.log("pos: " + $.QueryString["pos"] );
}

/*
 * These test functions partially validate the values entered, and partially prepare the final document.
 * This one tests if data was entered into the requisite fields on the first page, and highlights input boxes with a thin
 * red line if they contain no or wrong input.
 */

function testGeneralPage ()
{
            isGeneralPageOk = true;

            if ( !$('#beneficiary-name').val() ) {
                $('#beneficiary-name').addClass("cla-alert");
                isGeneralPageOk = false;
            } else {
                $('#beneficiary-name').removeClass("cla-alert");
            }

            if ( !$('#project-name').val() ) {
                $('#project-name').addClass("cla-alert");
                isGeneralPageOk = false;
            } else {
                $('#project-name').removeClass("cla-alert");
		    }

            if ( !$('#project-website').val() ||
                 !validateURL( $('#project-website').val() ) ) {
                $('#project-website').addClass("cla-alert");
                isGeneralPageOk = false;
            } else {
                $('#project-website').removeClass("cla-alert");
            }

            if ( !$('#project-email').val() ||
                 !validateEmail($('#project-email').val()) )
            {
                $('#project-email').addClass("cla-alert");
                isGeneralPageOk = false;
            } else {
                $('#project-email').removeClass("cla-alert");
            }

            if ( !$('#project-jurisdiction').val() ) {
                $('#project-jurisdiction').addClass("cla-alert");
                isGeneralPageOk = false;
            } else {
                $('#project-jurisdiction').removeClass("cla-alert");
            }


    testReviewPage();

    return isGeneralPageOk;
}

/*
 * This validates and prepares options on the copyright page.
 */

function testCopyrightPage ()
{
            isCopyrightPageOk = true;

            var outboundChoices = $( "#outboundlist" ).val() || [];
            var mediaChoices    = $( "#medialist" ).val() || [];

            if ( !$('#outboundlist').val() ) {
                outboundCopyrightLicenses = "";
                // $('#outboundlist').addClass("cla-alert");
                // isCopyrightPageOk = false;
            } else {
                outboundCopyrightLicenses = outboundChoices.join(", ");
                if ( doDebug)
                    console.log("outboundCopyrightLicenses: " +
                            outboundCopyrightLicenses);

                // $('#outboundlist').removeClass("cla-alert");
            }

            if ( $('#outboundlist-custom').val() ) {

                if ( !$('#outboundlist').val() ) {
                    outboundCopyrightLicenses =
                        $('#outboundlist-custom').val();
                } else {
                    outboundCopyrightLicenses +=
                        ", " + $('#outboundlist-custom').val();
                }
                if ( doDebug)
                    console.log("outboundCopyrightLicenses: " +
                        outboundCopyrightLicenses);
            }

           if ( !$('#license-policy-location').val() ) {
                LicensePolicyLocation = "";
            } else {
                LicensePolicyLocation = $('#license-policy-location').val();

            }

            // FIXME
            /*
            if ( !$('#medialist').val() ) {
                $('#medialist').addClass("cla-alert");
                isCopyrightPageOk = false;
            } else {
                */
                mediaLicenses = mediaChoices.join(", ");
                if ( doDebug)
                    console.log("mediaLicenses: " +
                            mediaLicenses);

                // $('#medialist').removeClass("cla-alert");
            // }

    testReviewPage();

    return isCopyrightPageOk;
}

/*
 * This validates and prepares options on the patent page (if any).
 */

function testPatentPage ()
{
            isPatentPageOk = true;

            testReviewPage();

            return isPatentPageOk;
}

/*
 * This validates and prepares the review page, and creates the text of the agreement.
 */

function testReviewPage ()
{
            isReviewPageOk = true;

            if ( doDebug)
                console.log("At testReviewPage");
            // This sets the document title
            $('#review-text-fla #tmp-title').html("Fiduciary License Agreement 2.0");
            $('#review-text-fla-entity #tmp-title').html("Fiduciary License Agreement 2.0");
            $('#review-text #tmp-title').html("Contributor Agreement");
            $('#review-text-entity #tmp-title').html("Contributor Agreement");
            // This shows the subtitle FIXME some of this, like '#tmp-subtitle-based' could prob be removed b/c it is never not needed
            $('#review-text-fla #tmp-subtitle-based').show();
            $('#review-text-fla #tmp-subtitle-based').removeClass("nuke");
            $('#review-text-fla-entity #tmp-subtitle-based').show();
            $('#review-text-fla-entity #tmp-subtitle-based').removeClass("nuke");
            $('#review-text #tmp-subtitle-based').hide();
            $('#review-text #tmp-subtitle-based').addClass("nuke");
            $('#review-text-entity #tmp-subtitle-based').hide();
            $('#review-text-entity #tmp-subtitle-based').addClass("nuke");
            // Sets whether it is an individual or entity based agreement
            $('#review-text-fla #tmp-contributor-type').html("Individual");
            $('#review-text-fla-entity #tmp-contributor-type').html("Entity");
            $('#review-text #tmp-contributor-type').html("Individual");
            $('#review-text-entity #tmp-contributor-type').html("Entity");

            // if the beneficiary is empty, sets it to a blank field
            if ( !$("#beneficiary-name").val() )
            {
                $("#review-beneficiary-name").html( emptyField );
                $('#review-text-fla #tmp-beneficiary-name').html( emptyField );
                $('#review-text-fla-entity #tmp-beneficiary-name').html( emptyField );
                $('#review-text #tmp-beneficiary-name').html( emptyField );
                $('#review-text-entity #tmp-beneficiary-name').html( emptyField );
                // the empty field is save to the configs
                configs['beneficiary-name'] = '';
            // if a beneficiary is given, its name is inserted into the document
            } else {
                $("#review-beneficiary-name").html(
                    $("#beneficiary-name").val() );
                $('#review-text-fla #tmp-beneficiary-name').html( $("#beneficiary-name").val() );
                $('#review-text-fla-entity #tmp-beneficiary-name').html( $("#beneficiary-name").val() );
                $('#review-text #tmp-beneficiary-name').html( $("#beneficiary-name").val() );
                $('#review-text-entity #tmp-beneficiary-name').html( $("#beneficiary-name").val() );
                // beneficiary name is save to the configs
                configs['beneficiary-name'] = $("#beneficiary-name").val();
            }

            // if no project name is given, it is set to a blank field in the document
            if ( !$("#project-name").val() )
            {
                $("#review-project-name").html( emptyField );
                $('#review-text-fla #tmp-project-name').html( emptyField );
                $('#review-text-fla-entity #tmp-project-name').html( emptyField );
                $('#review-text #tmp-project-name').html( emptyField );
                $('#review-text-entity #tmp-project-name').html( emptyField );
                // the project name is set to a blank field in the configs
                configs['project-name'] = '';
            // otherwise, the project-name field in the text is set to the project name entered
            } else {
                $("#review-project-name").html(
                    $("#project-name").val() );
                $('#review-text-fla #tmp-project-name').html( $("#project-name").val() );
                $('#review-text-fla-entity #tmp-project-name').html( $("#project-name").val() );
                $('#review-text #tmp-project-name').html( $("#project-name").val() );
                $('#review-text-entity #tmp-project-name').html( $("#project-name").val() );
                // saving the project name to configs
                configs['project-name'] = $("#project-name").val();
            }
            // Disable the preamble by default in the agreement text
            $('#review-text #tmp-preamble').hide();
            $('#review-text #tmp-preamble').addClass("nuke");
            $('#review-text-entity #tmp-preamble').hide();
            $('#review-text-entity #tmp-preamble').addClass("nuke");
            // In the how-to instructions of the agreements, set FLA or CA respectively
            $('#review-text-fla #tmp-how-to').html("FLA");
            $('#review-text-fla-entity #tmp-how-to').html("FLA");
            $('#review-text #tmp-how-to').html("Contributor Agreement");
            $('#review-text-entity #tmp-how-to').html("Contributor Agreement");

            // Hide the entity definitions for FLA FIXME why also for FLA-entity?
            $('#review-text-fla #tmp-entity-definitions').hide();
            $('#review-text-fla-entity #tmp-entity-definitions').hide();
            // For patent pledge (CLA=, show entity definitions
            if ( $( "#patent-type" ).val() == 'Patent-Pledge' ) {
                $('#review-text .tmp-entity-definitions').show();
                $('#review-text-entity .tmp-entity-definitions').show();
            }
            // If CLA but no patent pledge, hide entity definitions
            else {
                $('#review-text .tmp-entity-definitions').hide();
                $('#review-text-entity .tmp-entity-definitions').hide();
             }
            // if project website field is empty, replace it with a blank line
            if ( !$("#project-website").val() )
            {
                $("#review-project-website").html( emptyField );
                configs['project-website'] = '';
            // if project-website is not empty, insert it into the text
            } else
            {
                $("#review-project-website").html(
                    $("#project-website").val() );
                configs['project-website'] = $("#project-website").val();
            }
            // if the project email is, empty, set a blank line 
            if ( !$("#project-email").val() )
            {
                $("#review-project-email").html( emptyField );
                $('#review-text-fla #tmp-project-email').html( emptyField );
                $('#review-text-fla-entity #tmp-project-email').html( emptyField );
                $('#review-text #tmp-project-email').html( emptyField );
                $('#review-text-entity #tmp-project-email').html( emptyField );
                configs['project-email'] = '';
            } else
            // if the project-email is not empty, insert it into the text
            {
                $("#review-project-email").html(
                    $("#project-email").val() );
                $('#review-text-fla #tmp-project-email').html( $("#project-email").val() );
                $('#review-text-fla-entity #tmp-project-email').html( $("#project-email").val() );
                $('#review-text #tmp-project-email').html( $("#project-email").val() );
                $('#review-text-entity #tmp-project-email').html( $("#project-email").val() );
                configs['project-email'] = $("#project-email").val();
            }
            // if the contributor-process-url is empty, insert a blank line in its place
            if ( !$("#contributor-process-url").val() )
            {
                $("#review-contributor-process-url").html( emptyField );
                $('#review-text-fla #tmp-submission-instructions').html( emptyField );
                $('#review-text-fla-entity #tmp-submission-instructions').html( emptyField );
                $('#review-text #tmp-submission-instructions').html( emptyField );
                $('#review-text-entity #tmp-submission-instructions').html( emptyField );
                configs['process-url'] = '';
            // if the process-url is not empty, insert the value into the agreement text
            } else {
                $("#review-contributor-process-url").html(
                    $("#contributor-process-url").val() );
                $('#review-text-fla #tmp-submission-instructions').html( $("#contributor-process-url").val() );
                $('#review-text-fla-entity #tmp-submission-instructions').html( $("#contributor-process-url").val() );
                $('#review-text #tmp-submission-instructions').html( $("#contributor-process-url").val() );
                $('#review-text-entity #tmp-submission-instructions').html( $("#contributor-process-url").val() );
                configs['process-url'] =
                    $("#contributor-process-url").val();
            }
            // if the project-jurisdiction is empty, insert a blank line
            if ( !$("#project-jurisdiction").val() )
            {
                $("#review-project-jurisdiction").html( emptyField );
                $('#review-text-fla #tmp-project-jurisdiction').html( emptyField );
                $('#review-text-fla-entity #tmp-project-jurisdiction').html( emptyField );
                $('#review-text #tmp-project-jurisdiction').html( emptyField );
                $('#review-text-entity #tmp-project-jurisdiction').html( emptyField );
                configs['project-jurisdiction'] = '';
            // else, insert the value of project-jurisdiction into the text
            } else{
                $("#review-project-jurisdiction").html(
                    $("#project-jurisdiction").val() );
                $('#review-text-fla #tmp-project-jurisdiction').html(
                    $("#project-jurisdiction").val() );
                $('#review-text-fla-entity #tmp-project-jurisdiction').html(
                    $("#project-jurisdiction").val() );
                $('#review-text #tmp-project-jurisdiction').html(
                    $("#project-jurisdiction").val() );
                $('#review-text-entity #tmp-project-jurisdiction').html(
                    $("#project-jurisdiction").val() );
                configs['project-jurisdiction'] =
                    $("#project-jurisdiction").val();
            }

//TODO / FIXME
            /* FSFE Compliance */
            /* if ( !$("#fsfe-compliance").val() || $("#fsfe-compliance").val() == 'No FSFE Compliance' )
            {
              $("#review-fsfe-compliance").html( 'No FSFE Compliance' );
              $("#tmp-fsfe-compliance").html( emptyField );
              $("#tmp-fsfe-compliance").addClass("nuke");
              $("#tmp-fsfe-compliance").hide();
              configs['fsfe-compliance'] = '';
            } else if ( $("#fsfe-compliance").val() == 'FSFE Compliance')
            {
                $("#review-fsfe-compliance").html( 'FSFE Compliance' );
                $("#tmp-fsfe-compliance").removeClass("nuke");
                $("#tmp-fsfe-compliance").show();
                $("#tmp-fsfe-compliance").html(
                    fsfePreamble );
                configs['fsfe-compliance'] = "fsfe-compliance";
            } */


            /* Agreement (Non)Exclusivity */

            // This replaces the lower case agreement-exclusivity with the upper case version
            // FIXME why is this method used here (and for patent license type), instead of the alternative methods like just replacing a fixed string?
            // If possible, remove this method to reduce complexity (or replace the other methods)
            var cleanVersion = '';
            if ( $("#agreement-exclusivity").val() in dictionary )
            {
                cleanVersion =
                    dictionary[$("#agreement-exclusivity").val()];
            } else {
                cleanVersion = $("#agreement-exclusivity").val();
            }

            $("#review-agreement-exclusivity").html(
                cleanVersion );

            $('#review-text-fla #tmp-contributor-exclusivity-1').html( cleanVersion );
            $('#review-text-fla-entity #tmp-contributor-exclusivity-1').html( cleanVersion );
            $('#review-text #tmp-contributor-exclusivity-1').html( cleanVersion );
            $('#review-text-entity #tmp-contributor-exclusivity-1').html( cleanVersion );

            configs['agreement-exclusivity'] =
                $("#agreement-exclusivity").val();

            // If there is an exclusive outbound copyright license, activate the requisite options
            if ( $("#agreement-exclusivity").val() == 'exclusive' )
            {
                $('#review-text-fla #tmp-contributor-exclusivity-2').html("exclusive");
                $('#review-text-fla-entity #tmp-contributor-exclusivity-2').html("exclusive");
                $('#review-text #tmp-contributor-exclusivity-2').html("Exclusive");
                $('#review-text-entity #tmp-contributor-exclusivity-2').html("Exclusive");
                $('#review-text #tmp-license-back').show();
                $('#review-text #tmp-license-back').removeClass("nuke");
                $('#review-text-entity #tmp-license-back').show();
                $('#review-text-entity #tmp-license-back').removeClass("nuke");
            // if there is no outbound exclusive copyright license, activate the respective options
            } else {
                $('#review-text #tmp-contributor-exclusivity-2').html("NON-exclusive");
                $('#review-text-entity #tmp-contributor-exclusivity-2').html("NON-exclusive");
                $('#review-text #tmp-license-back').hide();
                $('#review-text #tmp-license-back').addClass("nuke");
                $('#review-text-entity #tmp-license-back').hide();
                $('#review-text-entity #tmp-license-back').addClass("nuke");
            }

            // inserts the fsfeField into the possible licenses FIXME - if this is not even checked, why is this not fixed in text?
            $('#review-text-fla #tmp-licenses-2').html( fsfeField );
            $('#review-text-fla-entity #tmp-licenses-2').html( fsfeField );
            // If not outbound copyright licenses are set, insert a blank space into the text
            if ( !outboundCopyrightLicenses ) {
                $('#review-text-fla #tmp-licenses-fsfe').html( emptyField );
                $('#review-text-fla-entity #tmp-licenses-fsfe').html( emptyField );
                $('#review-text #tmp-licenses-non-fsfe').html( emptyField );
                $('#review-text-entity #tmp-licenses-non-fsfe').html( emptyField );
            // else, insert the list of possible licenses into the agreement text
            } else {
                $('#review-text-fla #tmp-licenses-fsfe').html( outboundCopyrightLicenses );
                $('#review-text-fla-entity #tmp-licenses-fsfe').html( outboundCopyrightLicenses );
                $('#review-text #tmp-licenses-non-fsfe').html( outboundCopyrightLicenses );
                $('#review-text-entity #tmp-licenses-non-fsfe').html( outboundCopyrightLicenses );
            }
            // if option 1 (fsfe approved licenses) is selected for outbound licenses, set the outbound options as appropriate
            if ( $("#outbound-option-fsfe").prop("checked") )
                setOutboundOptionFsfe();
            // if option 2 (list of licenses) is selected for outbound licenses, call the requisite function
            if ( $("#outbound-option-same-licenses").prop("checked") )
                setOutboundOptionSameLicenses();
            // if option 3 (license policy) is selected for outbound licenses, set the appropriate text options
            if ( $("#outbound-option-license-policy").prop("checked") )
                setOutboundOptionLicensePolicy();
            // if option 4 (same licenses as on submission date) is selected, set the appropriate options
            if ( $("#outbound-option-same").prop("checked") )
                setOutboundOptionSame();

            // if outbound-option-no-commitment is used, call the appropriate function
            if ( $("#outbound-option-no-commitment").prop("checked") )
                setOutboundOptionNoCommitment();

            // set the outbound custom list of outbound licenses in the document text / FIXME why is this not checked / done only if enabled?
            $("#review-outbound-license-other").html(
                $("#outboundlist-custom").val() );
            // sets the config to the requisite list of licenses
            configs['outboundlist-custom'] = $("#outboundlist-custom").val();

            // set the lise of media licenses in the document text
            $("#review-media-licenses").html(
                mediaLicenses );
            configs['medialist'] = mediaLicenses;

            // hide the media licenses part in the text for FLA versions
            $('#review-text-fla #tmp-outbound-media-license').hide();
            $('#review-text-fla #tmp-outbound-media-license').addClass("nuke");
            $('#review-text-fla-entity #tmp-outbound-media-license').hide();
            $('#review-text-fla-entity #tmp-outbound-media-license').addClass("nuke");
            // for non FLA, if no media license(s) are set, also hide the media license part in the text
            if ( mediaLicenses == "None" ) {
                $('#review-text #tmp-outbound-media-license').hide();
                $('#review-text #tmp-outbound-media-license').addClass("nuke");
                $('#review-text-entity #tmp-outbound-media-license').hide();
                $('#review-text-entity #tmp-outbound-media-license').addClass("nuke");
            } else {
            // if media license(s) are set, insert the list into the agreement text
                if ( mediaLicenses == "" )
                    mediaLicenses = emptyField;
                $('#review-text #tmp-media-licenses').html(
                    mediaLicenses );
                $('#review-text-entity #tmp-media-licenses').html(
                    mediaLicenses );
                $('#review-text #tmp-outbound-media-license').show();
                $('#review-text #tmp-outbound-media-license').removeClass("nuke");
                $('#review-text-entity #tmp-outbound-media-license').show();
                $('#review-text-entity #tmp-outbound-media-license').removeClass("nuke");
            }

            // this replaces uppercase with lower case iirc. FIXME similar to above, is this necessary?
            var cleanVersion = '';
            if ( $("#patent-type").val() in dictionary )
            {
                cleanVersion =
                    dictionary[$("#patent-type").val()];
            } else {
                cleanVersion = $("#patent-type").val();
            }

            $("#review-patent-type").html(
                cleanVersion );

            $('#review-text-fla #tmp-patent-option').html( cleanVersion );
            $('#review-text-fla-entity #tmp-patent-option').html( cleanVersion );
            $('#review-text #tmp-patent-option').html( cleanVersion );
            $('#review-text-entity #tmp-patent-option').html( cleanVersion );

            configs['patent-option'] = $("#patent-type").val();
            // In case a traditional patent license is selected, enable the particular options in the text
            if ( $("#patent-type").val() == 'Traditional' )
            {   // for FLA individual and entity
                $('#review-text-fla #tmp-patent-option-pledge').hide();
                $('#review-text-fla #tmp-patent-option-pledge').addClass("nuke");
                $('#review-text-fla-entity #tmp-patent-option-pledge').hide();
                $('#review-text-fla-entity #tmp-patent-option-pledge').addClass("nuke");

                // for CLA individual
                $('#review-text #tmp-patent-option-traditional').show();
                $('#review-text #tmp-patent-option-traditional').removeClass("nuke");
                $('#review-text #tmp-patent-option-pledge').hide();
                $('#review-text #tmp-patent-option-pledge').addClass("nuke");
                $('#review-text #tmp-outbound-special').show();
                $('#review-text #tmp-outbound-special').removeClass("nuke");
                // for CLA entity
                $('#review-text-entity #tmp-patent-option-traditional').show();
                $('#review-text-entity #tmp-patent-option-traditional').removeClass("nuke");
                $('#review-text-entity #tmp-patent-option-pledge').hide();
                $('#review-text-entity #tmp-patent-option-pledge').addClass("nuke");
                $('#review-text-entity #tmp-outbound-special').show();
                $('#review-text-entity #tmp-outbound-special').removeClass("nuke");

            } else {
                // if no traditional patent license is selected, hide the requisite options in the text
                $('#review-text #tmp-patent-option-traditional').hide();
                $('#review-text #tmp-patent-option-traditional').addClass("nuke");
                $('#review-text #tmp-patent-option-pledge').show();
                $('#review-text #tmp-patent-option-pledge').removeClass("nuke");
                $('#review-text #tmp-outbound-special').hide();
                $('#review-text #tmp-outbound-special').addClass("nuke");

                $('#review-text-entity #tmp-patent-option-traditional').hide();
                $('#review-text-entity #tmp-patent-option-traditional').addClass("nuke");
                $('#review-text-entity #tmp-patent-option-pledge').show();
                $('#review-text-entity #tmp-patent-option-pledge').removeClass("nuke");
                $('#review-text-entity #tmp-outbound-special').hide();
                $('#review-text-entity #tmp-outbound-special').addClass("nuke");

            }


            testApplyPage();

            return isReviewPageOk;
}

/*
 * This validates the apply page, and generates the html, markdown and link to show.
 */

function testApplyPage ()
{
    if ( doDebug)
        console.log("at testApplyPage");

    isApplyPageOk = true;

    /* NEED TO REVIEW AFTER DECISIONS */
    /* FIXME can probably be deleted as this should always be shown from what I know
    if ( $("#contributor-option-entity").prop("checked") )
    {
        $("#apply-individual").hide();
        $("#apply-entity").show();
    }
    else
    {
        $("#apply-individual").show();
        $("#apply-entity").hide();
    }
    */
    /*
    $("#apply-individual").show();
    $("#apply-entity").show();
    $("#apply-fla").show();
    */

    // creates the querystring to recreate current wizard state
    finalQueryString = $.param(configs);
    if ( doDebug)
        console.log("finalQueryString: " + finalQueryString);
    // set final link to be used in the interface
    // EXAMPLE:
    // http://service.fabricatorz.com/query2form/?_replyto=project@rejon.org&_subject=Contributor%20License%20Agreement%20E-Signing%20Process&_body=Fill%20out%20the%20following%20form,%20then%20sign%20your%20initials%20to%20complete%20the%20Contributor%20License%20Agreement.&fullname=&Title=&Company=&email-address=&Physical-address=&Sign-with-your-initials=&_submit=sign


    var finalLink = document.URL.substr(0,document.URL.lastIndexOf('/')) +
                    "/?" +
                    finalQueryString;
    if ( doDebug )
        console.log("finalLink: " + finalLink);

    // if the project email is not empty, encode FIXME u2s service might still be broken
    if ( "" != configs["project-email"] )
    {
        var encoded_uri = encodeURIComponent(finalLink);
        shortUrl = getShortUrl(encoded_uri);
    // or use a blank shortUrl
    } else {
        shortUrl = '';
    }

    // This generates the links/urls for the e-signing form
    updateQuery4Form();

    if ( ! $('#contributor-process-url').val() )
    {
        if ( "" != configs["project-email"] )
        {
            if ( '1337' == debugNeedle )
                updateTestUrls();

            // the short or long form query is loaded
            var queryReady =
                (( "" != query4form_short ) ? query4form_short : query4form );

            // adjust the e-sign button and insert text for sharing
            $("#link-esign").attr("href", queryReady);
            $("#link-esign").addClass('btn-success');
            $("#link-esign").removeClass('btn-danger');
            $("#link-esign").html("Link to E-Signing Form");
            // FIXME (remove) This is the same text as in index html
            $("#signing-service").html('<b>Contributor Agreements</b>: ' +
                'Share the link with your contributors.');

            $("#embed-esign").html( getEmbedCode( queryReady ) );
            $("#embedding-service-all").show();

        // FIXME same
        } else {
            $("#link-esign").html( 'Need Project Email' );
            $("#link-esign").removeClass('btn-success');
            $("#link-esign").addClass('btn-danger');
            $("#signing-service").html('<b>Contributor Agreements</b>: ' +
                'Share the link with your contributors.');

            $("#embedding-service-all").hide();
        }
    // This set the sharing text to a different one mentioning the process url
    } else {
        $("#link-esign").attr("href", $('#contributor-process-url').val());
        $("#link-esign").addClass('btn-success');
        $("#link-esign").removeClass('btn-danger');
        $("#link-esign").html("Contributor Signing Website");
        $("#signing-service").html('<b>Your Contributor Process</b>: ' +
                                   'Share with your contributors.');
        $("#embed-esign").html( getEmbedCode(
            $('#contributor-process-url').val() ) );
        $("#embedding-service-all").show();

    }


   // sets the final link to short url or to the long url 
    var tmpFinalLink = '';
    if ( "" == shortUrl )
        tmpFinalLink = finalLink;
    else
        tmpFinalLink = shortUrl;
    // inserts the final link into all relevant link buttons
    $(".final-link").attr("href", finalLink );

    // This section is added to the bottom of the texts
    var finalBrew =
        '<section class="recreate"><h4>Recreate this Contributor License Agreement</h4>\n' +
        '<p><a href="' + tmpFinalLink + '">' + tmpFinalLink + '</p>' + "\n" +
        "</section>\n";
    // console.log("finalBrew: " + finalBrew);

    // These concatenate the generated agreement text and add the bottom part from finalBrew and remove the elements with nuke class
    // First one for cla
    // FIXME where are the .htmlstore classes coming from? 
    $("#embed-offscreen").html( $( "#review-text" ).html() + finalBrew );
    $(".htmlstore-individual").val( $( "#review-text-style" ).html() +
                         $( "#review-text" ).html() +
                         finalBrew );
    // remove all agreement parts with the nuke class
    $("#embed-offscreen .nuke").remove();

    // generate text for cla-entity and remove elements with nuke class
    $("#embed-offscreen-entity").html(
        $( "#review-text-entity" ).html() + finalBrew );
    $(".htmlstore-entity").val( $( "#review-text-style" ).html() +
                         $( "#review-text-entity" ).html() +
                         finalBrew );
    $("#embed-offscreen-entity .nuke").remove();
    
    // generate offscreen text for fla and remove elements with .nuke class
    $("#embed-offscreen-fla").html(
        $( "#review-text-fla" ).html() + finalBrew );
    $(".htmlstore-fla").val( $( "#review-text-style" ).html() +
                         $( "#review-text-fla" ).html() +
                         finalBrew );
    $("#embed-offscreen-fla .nuke").remove();

    // generate text for fla entity and remove elements with the nuke class
    $("#embed-offscreen-fla-entity").html(
        $( "#review-text-fla-entity" ).html() + finalBrew );
    $(".htmlstore-fla-entity").val( $( "#review-text-style" ).html() + 
                         $( "#review-text-fla-entity" ).html() +
                         finalBrew );
    $("#embed-offscreen-fla-entity .nuke").remove();

    // insert html into html modal and mkdn into mkdn modal
    $("#embed-agreement").html( $("#embed-offscreen").html() );
    $("#embed-agreement-mkdn").html( toMarkdown( $("#embed-offscreen").html() ) );
    // and for entity
    $("#embed-agreement-entity").html( $("#embed-offscreen-entity").html() );
    $("#embed-agreement-entity-mkdn").html( toMarkdown( $("#embed-offscreen-entity").html() ) );
    // and for fla
    $("#embed-agreement-fla").html( $("#embed-offscreen-fla").html() );
    $("#embed-agreement-fla-mkdn").html(  toMarkdown( $("#embed-offscreen-fla").html() ) );

    $("#embed-agreement-fla-entity").html( $("#embed-offscreen-fla-entity").html() );
    $("#embed-agreement-fla-entity-mkdn").html(  toMarkdown( $("#embed-offscreen-fla-entity").html() ) );

    return isApplyPageOk;
}

/*
 * This runs all the page functions. As some are called from each other, they will run at least twice. Because the others call testReviewPage, and testReviewPage call testApplyPage. FIXME
 */

function testAllPages()
{
    testGeneralPage();
    testCopyrightPage();
    testPatentPage();
    testReviewPage();
    testApplyPage();
}

/*
 * If a project email is configured, this function updates the esign url to either a the q2f url or an anchor. Only used for debugging.
 */

function updateTestUrls ()
{

    if ( configs['project-email'] )
        $("#link-esign").attr("href", serviceUrl + '/query2form');
    else
        $("#link-esign").attr("href", '#');

}

/*
 * Entry point on document load. (main)
 */

$(document).ready(function() {

    loadTemplates();

    queryStringToConfigs();
      if ( doDebug )
        setFakeData();
    updateConfigs();

    // if the debug needle is set, this sets the esign url with updateTestUrls()

    if ( '1337' == debugNeedle )
        updateTestUrls();


    // These are meant to update the configs or run functions if an input field changes. FIXME Only some are used.
    $( "#beneficiary-name" ).change(function() {
        configs["beneficiary-name"] = $("#beneficiary-name").val();
        // return testGeneralPage();
    });

    $( "#project-name" ).change(function() {
        configs["project-name"] = $("#project-name").val();
        // return testGeneralPage();
    });

    $( "#project-website" ).change(function() {
        configs["project-website"] = $("#project-website").val();
        // return testGeneralPage();
    });

    $( "#project-email" ).change(function() {
        configs["project-email"] = $( "#project-email" ).val();
        // return testGeneralPage();
    });

    $( "#contributor-process-url" ).change(function() {
        configs("process-url") = $("#contributor-process-url").val();
        // return testGeneralPage();
    });

    $( "#project-jurisdiction" ).change(function() {
        configs["project-jurisdiction"] = $("#project-jurisdiction").val();
        // return testGeneralPage();
    });


    $( "#outboundlist" ).change(function() {
        return testCopyrightPage();
    });

    $( "#outboundlist-custom" ).change(function() {
        return testCopyrightPage();
    });

    $( "#medialist" ).change(function() {
        return testCopyrightPage();
    });

    // This sets the default FSFE compliant status by default
    if (!configs["fsfe-compliance"] || configs["fsfe-compliance"] === "fsfe-compliance") {
    $("#fsfe-compliance").button("toggle"); // this is needed to set the default button to the green fsfe compliance
    selectFsfeCompliance(); // this is needed for fsfe compliance to activate / ui changes to happen without clicking the fsfe button
    }
    else {
        // or just set relevant agreement buttons to hidden?
        selectNonFsfeCompliance();
    }

    /*
     * Select all options for FSFE Compliance. FIXME should this be here or under testGeneral page?
     */
    function selectFsfeCompliance ()
    {
        $("#agreement-exclusivity-fsfe").show();
        $("#agreement-exclusivity-non-fsfe").hide();
        $('select[name*="agreement-exclusivity"] option[value="exclusive"]').prop('selected', true);
        $("#non-exclusive").remove();
        $("#outbound-option-4-label").hide();
        $("#outbound-option-5-label").hide();
        $("#outbound-option-fsfe").prop("checked", true);
        $("#license-policy-location").hide();
        $("#medialist-label").hide();
        $("#medialist").hide();
        $("#patent-type-fsfe").show();
        $("#patent-type-non-fsfe").hide();
        $("#patent-pledge").remove();
        $('select[name*="patent-type"] option[value="Traditional"]').prop('selected', true);
        $("#review-media-licenses-line").hide();
        $("#review-text").closest( "ul" ).hide();
        $("#review-text-entity").closest( "ul" ).hide();
        $("#review-text-fla").closest( "ul" ).show();
        $("#review-text-fla-entity").closest( "ul" ).show();
        $("#apply-individual").hide();
        $("#apply-entity").hide();
        $("#apply-fla").show();
        $("#apply-fla-entity").show();
        // set config option // hard-coded for now as $("#fsfe-compliance").val() has weird inconsistent results
        configs["fsfe-compliance"] = "fsfe-compliance";
    }

    /*
     * Select the options for non-fsfe compliance
     */

    function selectNonFsfeCompliance ()
    {
        $("#agreement-exclusivity-non-fsfe").show();
        $("#agreement-exclusivity-fsfe").hide();
        if ( !$('#non-exclusive').length ) {
            $('<option id="non-exclusive" value="non-exclusive">Non-Exclusive License</option>').appendTo("#agreement-exclusivity");
        }
        $("#outbound-option-4-label").show();
        $("#outbound-option-5-label").show();
        // FIXME disabled this, as it was prevening from loading query string/configs properly
        //if ( !!$('#outbound-option-license-policy').val() || !!$('#outbound-option-no-commitment').val() || !!$('#outbound-option-same-licenses').val() || !!($('#outbound-option-same').val() ) ) {
        //$("#outbound-option-fsfe").prop("checked", true); 
        //    }
        $("#outboundlist").hide();
        $("#outboundlist-custom").hide();
        $("#license-policy-location").hide();
        changeMediaList();
        $("#patent-type-non-fsfe").show();
        $("#patent-type-fsfe").hide();
        // FIXME Probably remove adding patent pledge here, as it then exists double
        $('<option id="patent-pledge" value="Patent-Pledge">Identified Patent Pledge</option>').appendTo("#patent-type");
        // FIXME this probably also has to be remove, as
        $('select[name*="patent-type"] option[value="Traditional"]').prop('selected', true);
        $("#review-media-licenses-line").show();
        $("#review-text").closest( "ul" ).show();
        $("#review-text-entity").closest( "ul" ).show();
        $("#review-text-fla").closest( "ul" ).hide();
        $("#review-text-fla-entity").closest( "ul" ).hide();
        $("#apply-individual").show();
        $("#apply-entity").show();
        $("#apply-fla").hide();
        $("#apply-fla-entity").hide();
        configs["fsfe-compliance"] = "non-fsfe-compliance";
    }


    // this should prob be under general page (and maybe use change for consistency)
    $( "#fsfe-compliance").click(function() {
        selectFsfeCompliance();
    });

    $( "#non-fsfe-compliance").click(function () {
        selectNonFsfeCompliance();
    });

    /*
     * This function shows the media list for CLA (non-fsfe) and hides it for FLA (fsfe)
     */

    function changeMediaList () {
        if ( $("#fsfe-compliance").hasClass('active') ) {
            $("#medialist-label").hide();
            $("#medialist").hide();
        }
        if ( $("#non-fsfe-compliance").hasClass('active') ) {
            $("#medialist-label").show();
            $("#medialist").show();
        }
    }

    /*
     * When the outbound outobound-option-fsfe is changed (outbound copyright option), this function hides the list of possible licenses, the field for custom lists and the license policy location field.
     * Then it changes the media list, hiding or showing it depending on whether fsfe compliance is active or not
     */

    $( "#outbound-option-fsfe" ).change(function() {
        $("#outboundlist").hide();
        $("#outboundlist-custom").hide();
        $("#license-policy-location").hide();
        changeMediaList();
        // return testGeneralPage();
    });

    /*
    * On changing the outbound-option same licenses, show relevant UI elements
    */

    $( "#outbound-option-same-licenses" ).change(function() {
        if ( $("#fsfe-compliance").hasClass('active') && $("#outbound-option-same-licenses").prop( "checked" ) ) {



            $("#outboundlist").show();
            $("#outboundlist-custom").hide();
        }
        if ( $("#non-fsfe-compliance").hasClass('active') && $("#outbound-option-same-licenses").prop( "checked" ) ) {
            $("#outboundlist").show();
            $("#outboundlist-custom").show();
        }
        $("#license-policy-location").hide();
        changeMediaList();
        // return testGeneralPage();
    });

    /*
     * On changing the outbound-option to license policy, this displays the requisite UI elements
     */

    $( "#outbound-option-license-policy" ).change(function() {
      $("#outboundlist").hide();
      $("#outboundlist-custom").hide();
      $("#license-policy-location").show();
      changeMediaList();
    });

    /*
     * On changing the outbound option to same license, adjust the UI elements
     */

    $( "#outbound-option-same" ).change(function() {
        $("#outboundlist").hide();
        $("#outboundlist-custom").hide();
        $("#license-policy-location").hide();
        changeMediaList();
        // return testGeneralPage();
    });

    /*
     * On selecting the outbound no-commitment option, adjust the requisite UI elements
     */

    $( "#outbound-option-no-commitment" ).change(function() {
        $("#outboundlist").hide();
        $("#outboundlist-custom").hide();
        $("#license-policy-location").hide();
        $("#medialist-label").hide();
        $("#medialist").hide();
        // return testGeneralPage();
    });

    /*
     * On selecting the patent type patent-pledge, disable or hide the patent options
     */

    $( "#patent-type" ).change(function() {
        if ( $( "#patent-type" ).val() == 'Patent-Pledge' )
            $("#patent-option-2-options").show();
        else
            $("#patent-option-2-options").hide();

    });

    /*
     * On clicking the e-sign link, if the project email is empty, disable the link and change the color of the esign button
     */

    $( "#link-esign" ).click(function() {
        if ( "" == configs["project-email"] )
        {
            $("#link-esign").removeAttr("href");
            $("#link-esign").removeClass('btn-success');
            $("#link-esign").addClass('btn-danger');
            $('#rootwizard').bootstrapWizard('show','general');
        }
    });

    /*
     * On a chnage in the esign button, update the q4f and set the link
     */

    $( "#link-esign" ).change(function() {
            updateQuery4Form();
            $("#link-esign").attr("href",
                ( "" != query4form_short ) ? query4form_short : query4form );
            $("#link-esign").addClass('btn-success');
            $("#link-esign").removeClass('btn-danger');
            $("#link-esign").html("Link to E-Signing Form");

    });

    /*
     * This function sets up the main wizard structure
     */

	$('#rootwizard').bootstrapWizard({onNext: function(tab, navigation, index)
    {
        if ( doDebug)
        {
            console.log("tab: " + tab);
            console.log("navigation: " + navigation);
            console.log("index: " + index);
        }

        switch( index )
        {
            case generalPageIndex + 1:
                if ( doDebug)
                    console.log("At SWITCH general: " + (generalPageIndex+1) );
                testGeneralPage();
                return true;
                break;
            case copyrightPageIndex + 1:
                if ( doDebug)
                    console.log("At SWITCH copyright: " +
                        (copyrightPageIndex+1) );
                testCopyrightPage();
                return true;
                break;
            case patentPageIndex + 1:
                if ( doDebug)
                    console.log("At SWITCH patent: " + (patentPageIndex+1) );
                testPatentPage();
                return true;
                break;
            case reviewPageIndex + 1:
                if ( doDebug)
                    console.log("At SWITCH review: " + (reviewPageIndex+1) );
                testReviewPage();
                return true;
                break;
            case applyPageIndex + 1:
                if ( doDebug)
                    console.log("At SWITCH apply: " + (applyPageIndex+1) );
                testApplyPage();
                return true;
                break;
        }
    /*
     * When a wizard tab is displayed, the index and the size are adjusted.
     */
    }, onTabShow: function(tab, navigation, index) {
        var $total = navigation.find('li').length;
        var $current = index+1;
        var $percent = ($current/$total) * 100;
        $('#rootwizard').find('.bar').css({width:$percent+'%'});
	},
    /*
     * On clicking a tab all pages are processed
     */
    onTabClick: function(tab, navigation, index)
    {
        testAllPages();
        return true;
    }
    }

    );

    // update the wizard position and based on the action in the url, switch to the requisite signing page
    updatePosition();
    if ( $.QueryString["action"] )
    {
        console.log( "action: " + $.QueryString["action"] );
        switch ( $.QueryString["action"] )
        {
            case 'sign-entity':
                if ( doDebug)
                    console.log( "Sign entity" );
                $('#rootwizard').bootstrapWizard('last');
                testReviewPage();
                testApplyPage();
                console.log( 'sign-entity: ' + $('#review-text-entity').html() );
                $('#html2pdf-form-entity').submit();
                break;
            case 'sign-individual':
                if ( doDebug)
                    console.log( "Sign individual" );
                $('#rootwizard').bootstrapWizard('last');
                testReviewPage();
                testApplyPage();
                console.log("sign-indy: " +  $('#review-text').html() );
                $('#html2pdf-form-individual').submit();
                break;
            case 'sign-fla':
                if ( doDebug)
                    console.log( "Sign FLA" );
                $('#rootwizard').bootstrapWizard('last');
                testReviewPage();
                testApplyPage();
                console.log("sign-fla: " +  $('#review-text-fla').html() );
                $('#html2pdf-form-fla').submit();
                break;
            case 'sign-fla-entity':
                if ( doDebug)
                    console.log( "Sign FLA Entity" );
                $('#rootwizard').bootstrapWizard('last');
                testReviewPage();
                testApplyPage();
                console.log("sign-fla-entity: " +  $('#review-text-fla-entity').html() );
                $('#html2pdf-form-fla-entity').submit();
                break;
        }
    }

});
