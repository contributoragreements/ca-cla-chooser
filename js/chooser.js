/** cla chooser main javascript by Fabricatorz **/

/**
 * @TODO Need to make compact the config setting code and the review/apply
 * because lots of duplicated code.
 * @TODO fix that visual jump on patents tab
 * @TODO add cdn jquery and bootstrap and then have the local fallbacks
 * @TODO add other scaffolding for html5, standard sites, async
 * @TODO fix testGeneralPage() to be functionized so that each input tested
 * @TODO need to have some kind of timeout on the shorturl service, its blocking when service down
 *
 * @TODO finish making u2s work on catharina's server, with apache (server down right now)
 */
// $('#rootwizard').bootstrapWizard('show', 2); // (to skip a tab)

var doDebug             = false;
var debugNeedle         = 1337;

var services;

var gitversion;

$.ajax({
    timeout: 1000,
    async: false,
    url: 'version.log',
    dataType: "text",
    success: function(data) {
        gitversion = data;
    }
});
if ( doDebug )
    console.log(gitversion)

// added version to check what is running. maybe replace with short git commit hash added to pre
var version = "1.0"
$('#version').html(gitversion)

// @TODO really should make this configs and convert code below
$.ajax({
    timeout: 1000,
    async: false,
    url: 'js/config.json',
    dataType: "text",
    success: function(data) {
        services = $.parseJSON(data);
    }
});

var serviceUrl, urlShortener;

if ( ! services || typeof services.serviceUrl === 'undefined' )
    // this url does not exist right now, but does not make sense to run on service. and subdir seperately
    serviceUrl          = 'http://service.contributoragreements.org';
else
    serviceUrl          = services["serviceUrl"];

if ( ! services || typeof services.urlShortener === 'undefined' )
    // this url does not exist right now, but does not make sense to run on service. and subdir seperately
    urlShortener        = 'http://service.contributoragreements.org/u2s';
else
    urlShortener        = services["urlShortener"];


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

/** could even set defaults here
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
 * contributor-option-entity=entity|individual
 * agreement-exclusivity=exclusive|nonexclusive
 * outbound-option=same|same-licenses|fsfe|no-commitment
 * outboundlist=Artistic-1.0,Apache-2.0,LIST
 * outboundlist-custom=STRING
 * medialist=None|GFDL-1.1|CC-BY-1.0,GFDL-1.3,LIST
 * patent-option=Traditional|Patent-Pledge
 *
 * your-name=STRING
 * your-date=STRING
 * your-title=STRING
 * your-address=STRING
 *
 * pos=general|copyright|patents|review|apply
 */
var configs = {
    'beneficiary-name':           '',
    'project-name':               '',
    'project-website':            '',
    'project-email':              '',
    'process-url':                '',
    'project-jurisdiction':       '',
    'agreement-exclusivity':      '',
    'fsfe-compliance':            '',
    'fsfe-fla':                   '',
    'outbound-option':            '',
    'outboundlist':               '',
    'outboundlist-custom':        '',
    'medialist':                  '',
    'patent-option':              '',
    'your-date':                  '',
    'your-name':                  '',
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
 * @todo can combine this with review code and save code, but will need
 * to abstract the following more than likely into functions.
 * Then, that will allow creating a querystring easier
 */
function updateConfigs ()
{

    /* Type of Agreement */

    if ( configs["fsfe-fla"] )
        $('#typeof-agreement').val( configs["typeof-agreement"]);
    if ( doDebug )
        console.log("typeof-agreement: " + configs["typeof-agreement"]);
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
    if ( configs["fsfe-compliance"] == 'fsfe-compliance' )
      $('#fsfe-compliance').val(configs["fsfe-compliance"] );
    // this might have unintended side effects
        if ( doDebug )
            console.log("non-fsfe-compliance: " +
                configs["fsfe-compliance"]);
    else
      $('#fsfe-compliance').val(configs["non-fsfe-compliance"] );
      $('#non-fsfe-compliance').addClass('active')
      $('#fsfe-compliance').removeClass('active')
    if ( doDebug )
        console.log("non-fsfe-compliance: " +
            configs["fsfe-compliance"]);

    /* copyright */
    if ( configs["agreement-exclusivity"] == 'exclusive' )
        $("#agreement-exclusivity").val( 'exclusive' );
    else
        $("#agreement-exclusivity").val( 'non-exclusive' );
    if ( doDebug )
        console.log("agreement-exclusivity: " +
            configs["agreement-exclusivity"]);


    if ( configs["outbound-option"] == 'same' )
        $("#contributor-option-individual").prop('checked', true );

    // hide by default
    $("#outboundlist").hide();
    $("#outboundlist-custom").hide();


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
        // option-5
        case 'no-commitment':
            $("#outbound-option-no-commitment").prop('checked', true );
            $("#outbound-option-no-commitment" ).trigger( 'change' );
            // @todo delete later if no need
            // setOutboundOptionNoCommitment();
            break;
        // option-4
        case 'same':
        default:
            $("#outbound-option-same").prop('checked', true );
            $("#outbound-option-same" ).trigger( 'change' );
            // @todo delete later if no need
            // setOutboundOptionSame();
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

function loadTemplates ()
{
    // var converter = new Showdown.converter();
    /*
    $( "#review-text" ).load(
        "agreement-template-individual.html", function() {
            console.log("f-sign-indy: " +  $("#review-text").html() );
        });
    $( "#review-text-entity" ).load(
        "agreement-template-entity.html", function() {
            console.log("f-sign-entity: " +  $("#review-text-entity").html() );
        });

    $( "#review-text-style" ).load( "agreement-style.html", function() { });
    */

    /*
    $.ajax('agreement-template-individual.html', {
        timeout: 1000,
        async: false,
        success: function(resp) {
            $('#review-text').html(resp);
            if ( doDebug )
                console.log("f-sign-indy: " +  $("#review-text").html() );
        }
    });

    $.ajax('agreement-template-entity.html', {
        timeout: 1000,
        async: false,
        success: function(resp) {
            $('#review-text-entity').html(resp);
            if ( doDebug )
                console.log("f-sign-entity: " +  $("#review-text-entity").html() );
        }
    });
    */
    // maybe there should be some code here to only load whatever is wanted?
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
 * A better test now:
 * http://cla.fabricatorz.com/?beneficiary-name=Fabricatorz&project-name=Archive+Software&project-website=http%3A%2F%2Farchive.fabricatorz.com&project-email=jon%40fabricatorz.com&process-url=http%3A%2F%2Farchive.fabricatorz.com%2Fsigning&project-jurisdiction=United+States%2C+Hong+Kong%2C+and+China+Mainland.&agreement-exclusivity=&outbound-option=&outboundlist=&outboundlist-custom=&medialist=&patent-option=&pos=
 */
function setFakeData ()
{
    configs['beneficiary-name']         = 'Fabricatorz';
    configs['project-name']             = 'Archive Software';
    configs['project-website']           = 'http://archive.fabricatorz.com';
    configs['project-email']             = 'jon@fabricatorz.com';
    configs['process-url']   =
        'http://archive.fabricatorz.com/signing';
    configs['fsfe-compliance'] = 'non-fsfe-compliance';
    configs['project-jurisdiction']      =
        'United States, Hong Kong, and China Mainland.';
}

function nl2br (str, is_xhtml)
{
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ?
    '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' +
        breakTag + '$2');
}


function getShortUrl(uri)
{
    var result = '';
    $.ajax({
        url: urlShortener + '/set/?l=' + uri,
        async: false,
        success: function(data) { result = data; }
    });
    return result;
}

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

function ucFirst(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function ucWords(string) {
    return (string + '').
        replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g,
            function($1) {
                return $1.toUpperCase();
            });
}

function validateEmail(email)
{
        var re = /\S+@\S+\.\S+/;
            return re.test(email);
}

function validateURL(textval) {
          var urlregex = new RegExp(
                      "^(http|https|ftp)\://([a-zA-Z0-9\.\-]+(\:[a-zA-Z0-9\.&amp;%\$\-]+)*@)*((25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])|([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(\:[0-9]+)*(/($|[a-zA-Z0-9\.\,\?\'\\\+&amp;%\$#\=~_\-]+))*$");
                return urlregex.test(textval);
}


function oinspect (obj)
{
    var str = "";
    for(var k in obj)
        if (obj.hasOwnProperty(k))
            str += k + " = " + obj[k] + "\n";

    alert(str);
}

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

function getEmbedCode ( ourQuery )
{
    /*
    return htmlEscape('<script type="text/javascript">' + "\n" +
    'var iframe = document.createElement(\'iframe\');' + "\n" +
    'document.body.appendChild(iframe);' + "\n" +
    'iframe.src = \'' + ourQuery + '\';' + "\n" +
    'iframe.id = \'sign-process\';' + "\n" +
    'iframe.width = \'100%\';' +  "\n" +
    'iframe.height = \'100%\';' + "\n" +
    '</script>');
    */
    return htmlEscape(
    '<iframe id="e-sign-process" src="' + ourQuery +
    '" width="100%" height="100%"></iframe>'
    );
}

/*
function setFLACLAChoice ()
{
    if($('#fsfe-compliance') === "True") {
        $("#apply-individual").hide();
        $("#apply-entity").hide();
        $("#copyright").addClass('disabled');
        $("#patents").addClass('disabled');


    }

    //disable tabs / options that are not relevant
}
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

    $('#review-text #tmp-term-special').show();
    $('#review-text #tmp-term-special').removeClass("nuke");
    $('#review-text-entity #tmp-term-special').show();
    $('#review-text-entity #tmp-term-special').removeClass("nuke");
}

function setOutboundOptionFsfe ()
{
    /* remove the outbound-option in review */
    // $("#review-outbound-licenses").html( naField );
    $("#review-outbound-licenses").html(
        $("#outbound-option-fsfe").val() );

    configs['outbound-option'] = 'fsfe' ;

    $('#review-text-fla #tmp-outbound-section-all').show();
    $('#review-text-fla #tmp-outbound-section-all').removeClass("nuke");
    $('#review-text #tmp-outbound-section-all').show();
    $('#review-text #tmp-outbound-section-all').removeClass("nuke");
    $('#review-text-entity #tmp-outbound-section-all').show();
    $('#review-text-entity #tmp-outbound-section-all').removeClass("nuke");

    $('#review-text #tmp-licenses-2').html( fsfeField );
    $('#review-text-entity #tmp-licenses-2').html( fsfeField );

    /* put back order of sections after section 4 */
    putBackOrderOfSectionsAfterSection4();

    /*
    $("#tmp-licenses-2").hide();
    $("#tmp-licenses-2").addClass("nuke");
    */

    $('#review-text-fla #tmp-outbound-option-1-fsfe').show();
    $('#review-text-fla #tmp-outbound-option-1-fsfe').removeClass("nuke");
    $('#review-text #tmp-outbound-option-1-fsfe').show();
    $('#review-text #tmp-outbound-option-1-fsfe').removeClass("nuke");
    $('#review-text-entity #tmp-outbound-option-1-fsfe').show();
    $('#review-text-entity #tmp-outbound-option-1-fsfe').removeClass("nuke");

    $('#review-text-fla #tmp-outbound-option-2-fsfe').hide();
    $('#review-text-fla #tmp-outbound-option-2-fsfe').addClass("nuke");
    $('#review-text #tmp-outbound-option-2-fsfe').hide();
    $('#review-text #tmp-outbound-option-2-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-2-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-2-fsfe').addClass("nuke");

    $('#review-text-fla #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text-fla #tmp-outbound-option-2-non-fsfe').addClass("nuke");
    $('#review-text #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text #tmp-outbound-option-2-non-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-2-non-fsfe').addClass("nuke");

    $('#review-text-fla #tmp-outbound-option-3-fsfe').hide();
    $('#review-text-fla #tmp-outbound-option-3-fsfe').addClass("nuke");
    $('#review-text #tmp-outbound-option-3-fsfe').hide();
    $('#review-text #tmp-outbound-option-3-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-3-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-3-fsfe').addClass("nuke");

    $('#review-text-fla #tmp-outbound-option-4-non-fsfe').hide();
    $('#review-text-fla #tmp-outbound-option-4-non-fsfe').addClass("nuke");
    $('#review-text #tmp-outbound-option-4-non-fsfe').hide();
    $('#review-text #tmp-outbound-option-4-non-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-4-non-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-4-non-fsfe').addClass("nuke");

}

function setOutboundOptionSameLicenses ()
{
    configs['outbound-option'] = 'same-licenses';

    $("#tmp-outbound-section-all").show();
    $("#tmp-outbound-section-all").removeClass("nuke");

    $("#review-outbound-licenses").html( outboundCopyrightLicenses );

    $('#review-text #tmp-licenses').html( outboundCopyrightLicenses );
    $('#review-text #tmp-licenses-2').html( outboundCopyrightLicenses );

    $('#review-text-entity #tmp-licenses').html( outboundCopyrightLicenses );
    $('#review-text-entity #tmp-licenses-2').html( outboundCopyrightLicenses );

    configs['outboundlist'] = outboundCopyrightLicenses;

    /* put back order of sections after section 4 */
    putBackOrderOfSectionsAfterSection4();

    /*
    $("#tmp-licenses-2").show();
    $("#tmp-licenses-2").removeClass("nuke");
    */

    if ( !outboundCopyrightLicenses )
    {
        fixPatentParagraph( outBeforeField + " " +
                            outAfterField + " " + emptyField );
    } else {
        fixPatentParagraph();
    }

    if ( $("#fsfe-compliance").hasClass('active') )
    {
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

    } else {
        $('#review-text #tmp-outbound-option-1-fsfe').hide();
        $('#review-text #tmp-outbound-option-1-fsfe').addClass("nuke");
        $('#review-text-entity #tmp-outbound-option-1-fsfe').hide();
        $('#review-text-entity #tmp-outbound-option-1-fsfe').addClass("nuke");

        $('#review-text #tmp-outbound-option-2-fsfe').hide();
        $('#review-text #tmp-outbound-option-2-fsfe').addClass("nuke");
        $('#review-text-entity #tmp-outbound-option-2-fsfe').hide();
        $('#review-text-entity #tmp-outbound-option-2-fsfe').addClass("nuke");

        $('#review-text .tmp-outbound-option-2-non-fsfe').show();
        $('#review-text .tmp-outbound-option-2-non-fsfe').removeClass("nuke");
        $('#review-text-entity .tmp-outbound-option-2-non-fsfe').show();
        $('#review-text-entity .tmp-outbound-option-2-non-fsfe').removeClass("nuke");

        $('#review-text #tmp-outbound-option-3-fsfe').hide();
        $('#review-text #tmp-outbound-option-3-fsfe').addClass("nuke");
        $('#review-text-entity #tmp-outbound-option-3-fsfe').hide();
        $('#review-text-entity #tmp-outbound-option-3-fsfe').addClass("nuke");

        $('#review-text #tmp-outbound-option-4-non-fsfe').hide();
        $('#review-text #tmp-outbound-option-4-non-fsfe').addClass("nuke");
        $('#review-text-entity #tmp-outbound-option-4-non-fsfe').hide();
        $('#review-text-entity #tmp-outbound-option-4-non-fsfe').addClass("nuke");
    }
}

  function setOutboundOptionLicensePolicy ()
{
    $("#review-outbound-licenses").html(
      $("#outbound-option-license-policy").val() );

    $('#review-text-fla #tmp-outbound-option-1-fsfe').show();
    $('#review-text-fla #tmp-outbound-option-1-fsfe').removeClass("nuke");
    $('#review-text #tmp-outbound-option-1-fsfe').show();
    $('#review-text #tmp-outbound-option-1-fsfe').removeClass("nuke");
    $('#review-text-entity #tmp-outbound-option-1-fsfe').show();
    $('#review-text-entity #tmp-outbound-option-1-fsfe').removeClass("nuke");

    $('#review-text-fla #tmp-outbound-option-2-fsfe').hide();
    $('#review-text-fla #tmp-outbound-option-2-fsfe').addClass("nuke");
    $('#review-text #tmp-outbound-option-2-fsfe').hide();
    $('#review-text #tmp-outbound-option-2-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-2-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-2-fsfe').addClass("nuke");

    $('#review-text-fla #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text-fla #tmp-outbound-option-2-non-fsfe').addClass("nuke");
    $('#review-text #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text #tmp-outbound-option-2-non-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-2-non-fsfe').addClass("nuke");

    $('#review-text-fla #tmp-outbound-option-3-fsfe').show();
    $('#review-text-fla #tmp-outbound-option-3-fsfe').removeClass("nuke");
    $('#review-text #tmp-outbound-option-3-fsfe').show();
    $('#review-text #tmp-outbound-option-3-fsfe').removeClass("nuke");
    $('#review-text-entity #tmp-outbound-option-3-fsfe').show();
    $('#review-text-entity #tmp-outbound-option-3-fsfe').removeClass("nuke");

    $('#review-text-fla #tmp-license-policy-location').html( LicensePolicyLocation );
    $('#review-text #tmp-license-policy-location').html( LicensePolicyLocation );
    $('#review-text-entity #tmp-license-policy-location').html( LicensePolicyLocation );

    $('#review-text-fla #tmp-outbound-option-4-non-fsfe').hide();
    $('#review-text-fla #tmp-outbound-option-4-non-fsfe').addClass("nuke");
    $('#review-text #tmp-outbound-option-4-non-fsfe').hide();
    $('#review-text #tmp-outbound-option-4-non-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-4-non-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-4-non-fsfe').addClass("nuke");

    $('#review-text #tmp-licenses-2').html( fsfeField );
    $('#review-text-entity #tmp-licenses-2').html( fsfeField );

    /* put back order of sections after section 4 */
    putBackOrderOfSectionsAfterSection4();
}

function setOutboundOptionSame ()
{

    /* remove the outbound-option in review */
    $("#review-outbound-licenses").html(
        $("#outbound-option-same").val() );
    configs['outbound-option'] = 'same';

    /*
    $("#review-outbound-license-options").html(
        $("#outbound-option-same").val() );
    */

    $("#tmp-outbound-section-all").show();
    $("#tmp-outbound-section-all").removeClass("nuke");

    $('#review-text #tmp-licenses-2').html( emptyField );
    $('#review-text-entity #tmp-licenses-2').html( emptyField );

    /* put back order of sections after section 4 */
    putBackOrderOfSectionsAfterSection4();

    fixPatentParagraph( 'the license or licenses that We ' +
                        'are using on the Submission Date' );

    $('#review-text #tmp-outbound-option-1-fsfe').hide();
    $('#review-text #tmp-outbound-option-1-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-1-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-1-fsfe').addClass("nuke");

    $('#review-text #tmp-outbound-option-2-fsfe').hide();
    $('#review-text #tmp-outbound-option-2-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-2-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-2-fsfe').addClass("nuke");

    $('#review-text #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text #tmp-outbound-option-2-non-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-2-non-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-2-non-fsfe').addClass("nuke");

    $('#review-text #tmp-outbound-option-3-fsfe').hide();
    $('#review-text #tmp-outbound-option-3-fsfe').addClass("nuke");
    $('#review-text-entity #tmp-outbound-option-3-fsfe').hide();
    $('#review-text-entity #tmp-outbound-option-3-fsfe').addClass("nuke");

    $('#review-text #tmp-outbound-option-4-non-fsfe').show();
    $('#review-text #tmp-outbound-option-4-non-fsfe').removeClass("nuke");
    $('#review-text-entity #tmp-outbound-option-4-non-fsfe').show();
    $('#review-text-entity #tmp-outbound-option-4-non-fsfe').removeClass("nuke");
}

function setOutboundOptionNoCommitment ()
{
    /* remove the outbound-option in review */
    $("#review-outbound-licenses").html( naField );
    $("#review-media-licenses").html( naField );

    configs['outbound-option'] = 'no-commitment';

    /*
    $("#review-outbound-license-options").html(
        $("#outbound-option-no-commitment").val() );
    */
    
    /* remove entire section 4 */
    // entire section hidden: fixPatentParagraph(); @TODO can this go?
    // no multiple ids in one page... 
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
    $('#review-text #tmp-digit-term-2').html( '7.2' );
    $('#review-text #tmp-digit-term-3').html( '7.3' );
    $('#review-text #tmp-digit-term-special').html( '4, 5, 6, 7 and 8' );
    $('#review-text #tmp-digit-misc').html( '8' );
    $('#review-text #tmp-digit-misc-1').html( '8.1' );
    $('#review-text #tmp-digit-misc-2').html( '8.2' );
    $('#review-text #tmp-digit-misc-3').html( '8.3' );
    $('#review-text #tmp-digit-misc-4').html( '8.4' );
    $('#review-text #tmp-digit-misc-5').html( '8.5' );

    $('#review-text-entity #tmp-digit-disclaimer').html( '4.' );
    $('#review-text-entity #tmp-digit-waiver').html( '5.' );
    $('#review-text-entity #tmp-digit-approx-waiver').html( '6.' );
    $('#review-text-entity #tmp-digit-disclaimer-2').html( '4.' );
    $('#review-text-entity #tmp-digit-waiver-2').html( '5.' );
    $('#review-text-entity #tmp-digit-term').html( '7.' );
    $('#review-text-entity #tmp-digit-term-1').html( '7.1' );
    $('#review-text-entity #tmp-digit-term-2').html( '7.2' );
    $('#review-text-entity #tmp-digit-term-3').html( '7.3' );
    $('#review-text-entity #tmp-digit-term-special').html( '4, 5, 6, 7 and 8' );
    $('#review-text-entity #tmp-digit-misc').html( '8' );
    $('#review-text-entity #tmp-digit-misc-1').html( '8.1' );
    $('#review-text-entity #tmp-digit-misc-2').html( '8.2' );
    $('#review-text-entity #tmp-digit-misc-3').html( '8.3' );
    $('#review-text-entity #tmp-digit-misc-4').html( '8.4' );
    $('#review-text-entity #tmp-digit-misc-5').html( '8.5' );

    $('#review-text #tmp-term-special').hide();
    $('#review-text #tmp-term-special').addClass("nuke");
    $('#review-text-entity #tmp-term-special').hide();
    $('#review-text-entity #tmp-term-special').addClass("nuke");
}


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



function testGeneralPage ()
{
            isGeneralPageOk = true;
            if(!$("#fsfe-compliance").val() );
            // this should fix fsfe / non fsfe value
            var fsfeCompliance = $('#fsfe-choice > .btn.active').val()
            // var fsfeCompliance    = $( "#fsfe-compliance" ).val();

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

            if ( !$('#fsfe-compliance').val() || $('#fsfe-compliance').val() == "non-fsfe-compliance" ) {
                fsfeCompliance = "non-fsfe-compliance";
                if ( doDebug ) {
                      console.log("non-fsfe-compliance: " +
                              "NON-FSFE Compliance Enabled");
                            }
            } else {
                if (fsfeCompliance == "fsfe-compliance") {
                  if ( doDebug ) {
                      console.log("fsfe-compliance: " +
                              "FSFE Compliance Enabled");
                            }
                      }

              }


    testReviewPage();

    return isGeneralPageOk;
}

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

function testPatentPage ()
{
            isPatentPageOk = true;

            testReviewPage();

            return isPatentPageOk;
}

function testReviewPage ()
{
            isReviewPageOk = true;

            if ( doDebug)
                console.log("At testReviewPage");

            $('#review-text-fla #tmp-title').html("Fiduciary License Agreement 2.0");
            $('#review-text #tmp-title').html("Contributor Agreement");
            $('#review-text-entity #tmp-title').html("Contributor Agreement");

            $('#review-text-fla #tmp-subtitle-based').show();
            $('#review-text-fla #tmp-subtitle-based').removeClass("nuke");
            $('#review-text #tmp-subtitle-based').hide();
            $('#review-text #tmp-subtitle-based').addClass("nuke");
            $('#review-text-entity #tmp-subtitle-based').hide();
            $('#review-text-entity #tmp-subtitle-based').addClass("nuke");

            $('#review-text-fla #tmp-contributor-type').html("Individual");
            $('#review-text #tmp-contributor-type').html("Individual");
            $('#review-text-entity #tmp-contributor-type').html("Entity");


            if ( !$("#beneficiary-name").val() )
            {
                $("#review-beneficiary-name").html( emptyField );
                $('#review-text-fla #tmp-beneficiary-name').html( emptyField );
                $('#review-text #tmp-beneficiary-name').html( emptyField );
                $('#review-text-entity #tmp-beneficiary-name').html( emptyField );
                configs['beneficiary-name'] = '';
            } else {
                $("#review-beneficiary-name").html(
                    $("#beneficiary-name").val() );
                $('#review-text-fla #tmp-beneficiary-name').html( $("#beneficiary-name").val() );
                $('#review-text #tmp-beneficiary-name').html( $("#beneficiary-name").val() );
                $('#review-text-entity #tmp-beneficiary-name').html( $("#beneficiary-name").val() );
                configs['beneficiary-name'] = $("#beneficiary-name").val();
            }

            if ( !$("#project-name").val() )
            {
                $("#review-project-name").html( emptyField );
                $('#review-text-fla #tmp-project-name').html( emptyField );
                $('#review-text #tmp-project-name').html( emptyField );
                $('#review-text-entity #tmp-project-name').html( emptyField );
                configs['project-name'] = '';
            } else {
                $("#review-project-name").html(
                    $("#project-name").val() );
                $('#review-text-fla #tmp-project-name').html( $("#project-name").val() );
                $('#review-text #tmp-project-name').html( $("#project-name").val() );
                $('#review-text-entity #tmp-project-name').html( $("#project-name").val() );
                configs['project-name'] = $("#project-name").val();
            }

            $('#review-text #tmp-preamble').hide();
            $('#review-text #tmp-preamble').addClass("nuke");
            $('#review-text-entity #tmp-preamble').hide();
            $('#review-text-entity #tmp-preamble').addClass("nuke");

            $('#review-text-fla #tmp-how-to').html("FLA");
            $('#review-text #tmp-how-to').html("Contributor Agreement");
            $('#review-text-entity #tmp-how-to').html("Contributor Agreement");

            //
            $('#review-text-fla #tmp-entity-definitions').hide();
            if ( $( "#patent-type" ).val() == 'Patent-Pledge' ) {
                $('#review-text .tmp-entity-definitions').show();
                $('#review-text-entity .tmp-entity-definitions').show();
            }
            else {
                $('#review-text .tmp-entity-definitions').hide(); 
                $('#review-text-entity .tmp-entity-definitions').hide();
             }
            if ( !$("#project-website").val() )
            {
                $("#review-project-website").html( emptyField );
                configs['project-website'] = '';
            } else
            {
                $("#review-project-website").html(
                    $("#project-website").val() );
                configs['project-website'] = $("#project-website").val();
            }

            if ( !$("#project-email").val() )
            {
                $("#review-project-email").html( emptyField );
                $('#review-text-fla #tmp-project-email').html( emptyField );
                $('#review-text #tmp-project-email').html( emptyField );
                $('#review-text-entity #tmp-project-email').html( emptyField );
                configs['project-email'] = '';
            } else
            {
                $("#review-project-email").html(
                    $("#project-email").val() );
                $('#review-text-fla #tmp-project-email').html( $("#project-email").val() );
                $('#review-text #tmp-project-email').html( $("#project-email").val() );
                $('#review-text-entity #tmp-project-email').html( $("#project-email").val() );
                configs['project-email'] = $("#project-email").val();
            }

            if ( !$("#contributor-process-url").val() )
            {
                $("#review-contributor-process-url").html( emptyField );
                $('#review-text-fla #tmp-submission-instructions').html( emptyField );
                $('#review-text #tmp-submission-instructions').html( emptyField );
                $('#review-text-entity #tmp-submission-instructions').html( emptyField );
                configs['process-url'] = '';
            } else {
                $("#review-contributor-process-url").html(
                    $("#contributor-process-url").val() );
                $('#review-text-fla #tmp-submission-instructions').html( $("#contributor-process-url").val() );
                $('#review-text #tmp-submission-instructions').html( $("#contributor-process-url").val() );
                $('#review-text-entity #tmp-submission-instructions').html( $("#contributor-process-url").val() );
                configs['process-url'] =
                    $("#contributor-process-url").val();
            }

            if ( !$("#project-jurisdiction").val() )
            {
                $("#review-project-jurisdiction").html( emptyField );
                $('#review-text-fla #tmp-project-jurisdiction').html( emptyField );
                $('#review-text #tmp-project-jurisdiction').html( emptyField );
                $('#review-text-entity #tmp-project-jurisdiction').html( emptyField );
                configs['project-jurisdiction'] = '';
            } else{
                $("#review-project-jurisdiction").html(
                    $("#project-jurisdiction").val() );
                $('#review-text-fla #tmp-project-jurisdiction').html(
                    $("#project-jurisdiction").val() );
                $('#review-text #tmp-project-jurisdiction').html(
                    $("#project-jurisdiction").val() );
                $('#review-text-entity #tmp-project-jurisdiction').html(
                    $("#project-jurisdiction").val() );
                configs['project-jurisdiction'] =
                    $("#project-jurisdiction").val();
            }


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
            $('#review-text #tmp-contributor-exclusivity-1').html( cleanVersion );
            $('#review-text-entity #tmp-contributor-exclusivity-1').html( cleanVersion );

            configs['agreement-exclusivity'] =
                $("#agreement-exclusivity").val();

            if ( $("#agreement-exclusivity").val() == 'exclusive' )
            {
                $('#review-text-fla #tmp-contributor-exclusivity-2').html("exclusive");
                $('#review-text #tmp-contributor-exclusivity-2').html("Exclusive");
                $('#review-text-entity #tmp-contributor-exclusivity-2').html("Exclusive");
                $('#review-text #tmp-license-back').show();
                $('#review-text #tmp-license-back').removeClass("nuke");
                $('#review-text-entity #tmp-license-back').show();
                $('#review-text-entity #tmp-license-back').removeClass("nuke");

            } else {
                $('#review-text #tmp-contributor-exclusivity-2').html("NON-exclusive");
                $('#review-text-entity #tmp-contributor-exclusivity-2').html("NON-exclusive");
                $('#review-text #tmp-license-back').hide();
                $('#review-text #tmp-license-back').addClass("nuke");
                $('#review-text-entity #tmp-license-back').hide();
                $('#review-text-entity #tmp-license-back').addClass("nuke");
            }

            $('#review-text-fla #tmp-licenses-2').html( fsfeField );

            if ( !outboundCopyrightLicenses ) {
                $('#review-text-fla #tmp-licenses-fsfe').html( emptyField );
                $('#review-text #tmp-licenses-non-fsfe').html( emptyField );
                $('#review-text-entity #tmp-licenses-non-fsfe').html( emptyField );

            } else {
                $('#review-text-fla #tmp-licenses-fsfe').html( outboundCopyrightLicenses );
                $('#review-text #tmp-licenses-non-fsfe').html( outboundCopyrightLicenses );
                $('#review-text-entity #tmp-licenses-non-fsfe').html( outboundCopyrightLicenses );
            }

            if ( $("#outbound-option-fsfe").prop("checked") )
                setOutboundOptionFsfe();

            if ( $("#outbound-option-same-licenses").prop("checked") )
                setOutboundOptionSameLicenses();

            if ( $("#outbound-option-license-policy").prop("checked") )
                setOutboundOptionLicensePolicy();

            if ( $("#outbound-option-same").prop("checked") )
                setOutboundOptionSame();

            // outbound-option-no-commitment
            if ( $("#outbound-option-no-commitment").prop("checked") )
                setOutboundOptionNoCommitment();


            $("#review-outbound-license-other").html(
                $("#outboundlist-custom").val() );
            configs['outboundlist-custom'] = $("#outboundlist-custom").val();

            $("#review-media-licenses").html(
                mediaLicenses );
            configs['medialist'] = mediaLicenses;

            $('#review-text-fla #tmp-outbound-media-license').hide();
            $('#review-text-fla #tmp-outbound-media-license').addClass("nuke");

            if ( mediaLicenses == "None" ) {
                $('#review-text #tmp-outbound-media-license').hide();
                $('#review-text #tmp-outbound-media-license').addClass("nuke");
                $('#review-text-entity #tmp-outbound-media-license').hide();
                $('#review-text-entity #tmp-outbound-media-license').addClass("nuke");
            } else {
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
            $('#review-text #tmp-patent-option').html( cleanVersion );
            $('#review-text-entity #tmp-patent-option').html( cleanVersion );

            configs['patent-option'] = $("#patent-type").val();

            if ( $("#patent-type").val() == 'Traditional' )
            {
                $('#review-text-fla #tmp-patent-option-pledge').hide();
                $('#review-text-fla #tmp-patent-option-pledge').addClass("nuke");

                $('#review-text #tmp-patent-option-traditional').show();
                $('#review-text #tmp-patent-option-traditional').removeClass("nuke");
                $('#review-text #tmp-patent-option-pledge').hide();
                $('#review-text #tmp-patent-option-pledge').addClass("nuke");
                $('#review-text #tmp-outbound-special').show();
                $('#review-text #tmp-outbound-special').removeClass("nuke");

                $('#review-text-entity #tmp-patent-option-traditional').show();
                $('#review-text-entity #tmp-patent-option-traditional').removeClass("nuke");
                $('#review-text-entity #tmp-patent-option-pledge').hide();
                $('#review-text-entity #tmp-patent-option-pledge').addClass("nuke");
                $('#review-text-entity #tmp-outbound-special').show();
                $('#review-text-entity #tmp-outbound-special').removeClass("nuke");

            } else {
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

function testApplyPage ()
{
    if ( doDebug)
        console.log("at testApplyPage");

    isApplyPageOk = true;

    /* NEED TO REVIEW AFTER DECISIONS */
    /*
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
    // set final linkto be used in the interface




    // EXAMPLE:
    // http://service.fabricatorz.com/query2form/?_replyto=project@rejon.org&_subject=Contributor%20License%20Agreement%20E-Signing%20Process&_body=Fill%20out%20the%20following%20form,%20then%20sign%20your%20initials%20to%20complete%20the%20Contributor%20License%20Agreement.&fullname=&Title=&Company=&email-address=&Physical-address=&Sign-with-your-initials=&_submit=sign




    var finalLink = document.URL.substr(0,document.URL.lastIndexOf('/')) +
                    "/?" +
                    finalQueryString;
    // console.log("finalLink: " + finalLink);

    if ( "" != configs["project-email"] )
    {
        var encoded_uri = encodeURIComponent(finalLink);
        shortUrl = getShortUrl(encoded_uri);
    } else {
        shortUrl = '';
    }

    updateQuery4Form();

    if ( ! $('#contributor-process-url').val() )
    {
        if ( "" != configs["project-email"] )
        {
            if ( '1337' == debugNeedle )
                updateTestUrls();

            var queryReady =
                (( "" != query4form_short ) ? query4form_short : query4form );

            $("#link-esign").attr("href", queryReady);
            $("#link-esign").addClass('btn-success');
            $("#link-esign").removeClass('btn-danger');
            $("#link-esign").html("Link to E-Signing Form");
            $("#signing-service").html('<b>Contributor Agreements</b>: ' +
                'Share the link with your contributors.');

            $("#embed-esign").html( getEmbedCode( queryReady ) );
            $("#embedding-service-all").show();


        } else {
            $("#link-esign").html( 'Need Project Email' );
            $("#link-esign").removeClass('btn-success');
            $("#link-esign").addClass('btn-danger');
            $("#signing-service").html('<b>Contributor Agreements</b>: ' +
                'Share the link with your contributors.');

            $("#embedding-service-all").hide();
        }
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


    // make sure short file parameter shows up in emails, and form
    //
    // and then also update page
    // a final step will be to make sure that has SIGNED a doc
    // that the final PDF and HTML will be signed and attached to email

    var tmpFinalLink = '';
    if ( "" == shortUrl )
        tmpFinalLink = finalLink;
    else
        tmpFinalLink = shortUrl;

    $(".final-link").attr("href", finalLink );

    var finalBrew =
        '<section class="recreate"><h4>Recreate this Contributor License Agreement</h4>\n' +
        '<p><a href="' + tmpFinalLink + '">' + tmpFinalLink + '</p>' + "\n" +
        "</section>\n";
    // console.log("finalBrew: " + finalBrew);

    $("#embed-offscreen").html( $( "#review-text" ).html() + finalBrew );
    $(".htmlstore-individual").val( $( "#review-text-style" ).html() +
                         $( "#review-text" ).html() +
                         finalBrew );
    $("#embed-offscreen .nuke").remove();


    $("#embed-offscreen-entity").html(
        $( "#review-text-entity" ).html() + finalBrew );
    $(".htmlstore-entity").val( $( "#review-text-style" ).html() +
                         $( "#review-text-entity" ).html() +
                         finalBrew );
    $("#embed-offscreen-entity .nuke").remove();

    $("#embed-offscreen-fla").html(
        $( "#review-text-fla" ).html() + finalBrew );
    $(".htmlstore-fla").val( $( "#review-text-style" ).html() +
                         $( "#review-text-fla" ).html() +
                         finalBrew );
    $("#embed-offscreen-fla .nuke").remove();


    $("#embed-agreement").html( $("#embed-offscreen").html() );
    $("#embed-agreement-entity").html( $("#embed-offscreen-entity").html() );
    $("#embed-agreement-fla").html( $("#embed-offscreen-fla").html() );

    return isApplyPageOk;
}

function testAllPages()
{
    testGeneralPage();
    testCopyrightPage();
    testPatentPage();
    testReviewPage();
    testApplyPage();
}

function updateTestUrls ()
{
    /*
     * @TODO not working now, changed to localhost in index.html for now
     *
    $("#html2pdf-form-individual").attr("action", serviceUrl +
        '/html2pdf');
    $("#html2pdf-form-entity").attr("action", serviceUrl +
        '/html2pdf');
    */
    if ( configs['project-email'] )
        $("#link-esign").attr("href", serviceUrl + '/query2form');
    else
        $("#link-esign").attr("href", '#');

}


$(document).ready(function() {

    loadTemplates();
    
    queryStringToConfigs();
      if ( doDebug )
        setFakeData();
    
    //if ($('#fsfe-choice > .btn.active').val() == 'non-fsfe-compliance')
    //    configs['fsfe-compliance'] = 'non-fsfe-compliance'
    //else configs['fsfe-compliance'] = 'fsfe-compliance'
    updateConfigs();
    //if (configs['fsfe-compliance'] == 'non-fsfe-compliance')
        //$('#non-fsfe-compliance').addClass('active')
        //$('#fsfe-compliance').removeClass('active')

    if ( '1337' == debugNeedle )
        updateTestUrls();




    $("#patent-option-2-options").hide();


    $("#html2pdf-individual").click(function() {
        $('#html2pdf-form-individual').submit();
    });

    $("#html2pdf-entity").click(function() {
        $('#html2pdf-form-entity').submit();
    });
    $("#html2pdf-fla").click(function() {
        $('#html2pdf-form-fla').submit();
    });

    // @TODO need to make these each test each input, not ALL inputs
    $( "#beneficiary-name" ).change(function() {
        // return testGeneralPage();
    });

    $( "#project-name" ).change(function() {
        // return testGeneralPage();
    });

    $( "#project-website" ).change(function() {
        // return testGeneralPage();
    });

    $( "#project-email" ).change(function() {
        configs["project-email"] = $( "#project-email" ).val();

        // return testGeneralPage();
    });

    $( "#contributor-process-url" ).change(function() {
        // return testGeneralPage();
    });

    $( "#project-jurisdiction" ).change(function() {
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


    if (configs['fsfe-compliance'] == 'fsfe-compliance' || configs['fsfe-compliance'] == '') {
        $("#fsfe-compliance").button("toggle");
        selectFsfeCompliance(); }
    else if (configs['fsfe-compliance'] == 'non-fsfe-compliance') 
        { $("#non-fsfe-compliance").button("toggle");
        selectNonFsfeCompliance(); }

    $( "#fsfe-compliance").click(function() {
        selectFsfeCompliance();
    });

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
        $("#apply-individual").hide();
        $("#apply-entity").hide();
        $("#apply-fla").show();
    }

    $( "#non-fsfe-compliance").click(function () {
        selectNonFsfeCompliance();
    });

    function selectNonFsfeCompliance ()
    {
        $("#agreement-exclusivity-non-fsfe").show();
        $("#agreement-exclusivity-fsfe").hide();
        if ( !$('#non-exclusive').length ) {
            $('<option id="non-exclusive" value="non-exclusive">Non-Exclusive License</option>').appendTo("#agreement-exclusivity");
        }
        $("#outbound-option-4-label").show();
        $("#outbound-option-5-label").show();
        $("#outbound-option-fsfe").prop("checked", true);
        $("#outboundlist").hide();
        $("#outboundlist-custom").hide();
        $("#license-policy-location").hide();
        changeMediaList();
        $("#patent-type-non-fsfe").show();
        $("#patent-type-fsfe").hide();
        $('<option id="patent-pledge" value="Patent-Pledge">Identified Patent Pledge</option>').appendTo("#patent-type");
        $('select[name*="patent-type"] option[value="Traditional"]').prop('selected', true);
        $("#review-media-licenses-line").show();
        $("#review-text").closest( "ul" ).show();
        $("#review-text-entity").closest( "ul" ).show();
        $("#review-text-fla").closest( "ul" ).hide();
        $("#apply-individual").show();
        $("#apply-entity").show();
        $("#apply-fla").hide();
    }

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

    $( "#outbound-option-fsfe" ).change(function() {
        $("#outboundlist").hide();
        $("#outboundlist-custom").hide();
        $("#license-policy-location").hide();
        changeMediaList();
        // return testGeneralPage();
    });

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

    $( "#outbound-option-license-policy" ).change(function() {
      $("#outboundlist").hide();
      $("#outboundlist-custom").hide();
      $("#license-policy-location").show();
      changeMediaList();
    });

    $( "#outbound-option-same" ).change(function() {
        $("#outboundlist").hide();
        $("#outboundlist-custom").hide();
        $("#license-policy-location").hide();
        changeMediaList();
        // return testGeneralPage();
    });

    $( "#outbound-option-no-commitment" ).change(function() {
        $("#outboundlist").hide();
        $("#outboundlist-custom").hide();
        $("#license-policy-location").hide();
        $("#medialist-label").hide();
        $("#medialist").hide();
        // return testGeneralPage();
    });


    $( "#patent-type" ).change(function() {
        if ( $( "#patent-type" ).val() == 'Patent-Pledge' )
            $("#patent-option-2-options").show();
        else
            $("#patent-option-2-options").hide();

    });

    $( "#link-esign" ).click(function() {
        if ( "" == configs["project-email"] )
        {
            $("#link-esign").removeAttr("href");
            $("#link-esign").removeClass('btn-success');
            $("#link-esign").addClass('btn-danger');
            $('#rootwizard').bootstrapWizard('show','general');
        }
    });

    $( "#link-esign" ).change(function() {
            updateQuery4Form();
            $("#link-esign").attr("href",
                ( "" != query4form_short ) ? query4form_short : query4form );
            $("#link-esign").addClass('btn-success');
            $("#link-esign").removeClass('btn-danger');
            $("#link-esign").html("Link to E-Signing Form");

    });


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

    }, onTabShow: function(tab, navigation, index) {
        var $total = navigation.find('li').length;
        var $current = index+1;
        var $percent = ($current/$total) * 100;
        $('#rootwizard').find('.bar').css({width:$percent+'%'});
	},
    onTabClick: function(tab, navigation, index)
    {
        testAllPages();
        return true;
    }
    }

    );

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
        }
    }

    window.prettyPrint && prettyPrint()

});
