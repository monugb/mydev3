//Test Updated
var viewFields = "<ViewFields><FieldRef Name='ID' /><FieldRef Name='Title'/><FieldRef Name='PostCategory'/><FieldRef Name='PostType'/><FieldRef Name='PublishedDate'/><FieldRef Name='NumComments'/><FieldRef Name='Body'/><FieldRef Name='SortCalc'/><FieldRef Name='Country'/><FieldRef Name='StoreType'/></ViewFields>";
var listName = 'Posts';
var webpartName = 'Newsfeed';
var templateId = 'newsfeedTemplate';
var containerId = 'newsfeedContainer';
var blanktemplateId = 'emptyNewsfeedTemplate';

var currentUserEmail;
var newsfeedApi = "https://spnewsfeed.azurewebsites.net/api/SPNewsfeed";
var resourceApiUrl = "https://spnewsfeed.azurewebsites.net/";
var activeTab;
var communicationType = "Communications";
var taskType = "Task";
var feedbackType = "Feedback";
var PageLimit = 20;
var subsiteName;
$(document).ready(function () {
    if (objPageTitle == "Company & Culture" || objPageTitle == "Company &amp; Culture" || objPageTitle == "Women in Retail") {
        window.sessionStorage.removeItem('newsFeedPostsCollection');
        window.sessionStorage.removeItem('USER_INFO_LIST');
    }
	$.getScript(_spPageContextInfo.siteAbsoluteUrl + "/Style%20Library/StorePortal/Scripts/jquery.tmpl.js");
    //ExecuteOrDelayUntilScriptLoaded(GetCountryAndStoreFilter(0), _spPageContextInfo.siteAbsoluteUrl + "/Style%20Library/StorePortal/Scripts/jquery.tmpl.js");
    GetCountryAndStoreFilter(0);
	
});


function openNewsfeed(obj, event, selectedItemId, isRead) {
    //var isSelectedItemRead = obj[0].className == "newsfeedRead" ? 1 : 0;
    obj.removeClass('newsfeedUnread');
    obj[0].className = "newsfeedRead";
    
    /*
    var ajaxLoader = obj.parent().parent().parent().parent();
    if(ajaxLoader.find('.ajaxLoaderDiv').css('display') == 'none')
{	    ajaxLoader.find('.ajaxLoaderDiv').show();
	    ajaxLoader.find('.ajaxLoaderImg').show();
}	else{
	    ajaxLoader.find('.ajaxLoaderDiv').hide();
	    ajaxLoader.find('.ajaxLoaderImg').hide();
}
*/
    event.stopPropagation();
}

function GetCountryAndStoreFilter(counter) {
    console.log("Start - Called GetCountryAndStoreFilter(counter): " + new Date());
    if (typeof HQ_USER == 'undefined') {
        if (counter < 20)
            setTimeout(function () { GetCountryAndStoreFilter(counter++); }, 300);
    }
    else {
        if (objPageTitle == "Company & Culture" || objPageTitle == "Company &amp; Culture" || objPageTitle == "Women in Retail")
            subsiteName = 'corporate';
        else
            subsiteName = 'Blog';
            
            if(objPageTitle=="Windows 10")
            {
            	objPageTitle = "Win10";
            }

        console.log("End - Called GetCountryAndStoreFilter(counter): " + new Date());
        GetReadItemsFromUserInfo(0);
    }
}

function GetReadItemsFromUserInfo(counter) {
    console.log("Start - Called GetReadItemsFromUserInfo():" + new Date());
 	if (typeof USER_BlogUnReadIds == 'undefined') {
    console.log("Start - USER_BlogUnReadIds undefined - " + new Date());
        if (counter < 10)
            setTimeout(function () { GetReadItemsFromUserInfo(counter++); }, 300);
    }
    else
    {
     	GetNewsfeeds(true, false);
    }
}

function GetNewsfeeds(isCached, isQueryFull) {
    console.log("Start - Called GetNewsfeeds(): " + new Date());
    var qryPostCatg = '';
    qryCountry = '<Neq><FieldRef Name="Country" /><Value Type="TaxonomyFieldTypeMulti"></Value></Neq>';
    qryStoreType = '<Neq><FieldRef Name="StoreType" /><Value Type="TaxonomyFieldTypeMulti"></Value></Neq>';

    if (!HQ_USER) {
        if (USER_COUNTRY)
            qryCountry = '<Eq><FieldRef Name="Country" /><Value Type="TaxonomyFieldTypeMulti">' + USER_COUNTRY + '</Value></Eq>';
        if (USER_STORETYPE)
            qryStoreType = '<Eq><FieldRef Name="StoreType" /><Value Type="TaxonomyFieldTypeMulti">' + USER_STORETYPE + '</Value></Eq>';
    }

    if (objPageTitle == "" || objPageTitle == "Home") {
        qryPostCatg = '<Neq><FieldRef Name="PostCategory" /><Value Type="LookupMulti"></Value></Neq>';
    }
    else if (objPageTitle == "Microsoft Direct Business Sales") {
        objPageTitle = "MD Business Sales";
        qryPostCatg = '<Or>'
                    + '<Eq><FieldRef Name="PostCategory" /><Value Type="LookupMulti">' + objPageTitle + '</Value></Eq>'
                    + '<Eq><FieldRef Name="Product" /><Value Type="TaxonomyFieldType">' + objPageTitle + '</Value></Eq>'
                    + '</Or>';
    }
    else if (objPageTitle == "Company & Culture" || objPageTitle == "Company &amp; Culture" || objPageTitle == "Women in Retail" || objPageTitle == "Programs & Events" || objPageTitle == "Programs &amp; Events") {
        qryPostCatg = '<Eq><FieldRef Name="PostCategory" /><Value Type="LookupMulti">' + objPageTitle + '</Value></Eq>';
    }
    else if (objPageTitle == "Virtual Reality" ) {
    	objPageTitle = "VR";
        qryPostCatg = '<Or><Eq><FieldRef Name="PostCategory" /><Value Type="LookupMulti">' + objPageTitle + '</Value></Eq>'
                    + '<Eq><FieldRef Name="ProductCategory" /><Value Type="TaxonomyFieldType">' + objPageTitle + '</Value></Eq></Or>';
    }
    else {
        qryPostCatg = '<Or>'
                    + '<Eq><FieldRef Name="PostCategory" /><Value Type="LookupMulti">' + objPageTitle + '</Value></Eq>'
                    + '<Eq><FieldRef Name="Product" /><Value Type="TaxonomyFieldType">' + objPageTitle + '</Value></Eq>'
                    + '</Or>';
    }

    var queryText = '<View><Query><Where>'
                  + '<And>'
                  + '<Eq><FieldRef Name="_ModerationStatus" /><Value Type="ModStat">Approved</Value></Eq>'
                  + '<And>'
                  + '<Leq><FieldRef Name="PublishedDate" /><Value IncludeTimeValue="TRUE" Type="DateTime"><Today/></Value></Leq>'
                  + '<And>'
                  + '<Geq><FieldRef Name="ScheduledEndDate" /><Value IncludeTimeValue="FALSE" Type="DateTime"><Today/></Value></Geq>'
                  + '<And>'
                  + qryCountry
                  + '<And>'
                  + qryStoreType
                  + qryPostCatg
                  + '</And>'
                  + '</And>'
                  + '</And>'
                  + '</And>'
                  + '</And>'
                  + '</Where><OrderBy><FieldRef Name="SortCalc" Ascending="False" /></OrderBy></Query>';
    if (isQueryFull) {
        queryText += viewFields;
    }
    else {
        queryText += '<RowLimit>' + PageLimit + '</RowLimit>' + viewFields;
    }
    queryText += '</View>';

    this.webpartName = webpartName;
    this.unReadItems = unReadItems;
    this.siteUrl = siteUrl;

    bindDataToTemplate(_spPageContextInfo.siteAbsoluteUrl + "/" + subsiteName, listName, queryText, webpartName, USER_BlogUnReadIds, "#" + templateId, "#" + containerId, isCached, isQueryFull);
}

function toggleDesc(clickedObj, clickedItem) {
    var iscurrentItemRead = clickedObj.find('a.newsfeedRead').length;
    clickedObj.find('.newsFeedGeneric').toggle();
    clickedObj.find('a').removeClass('newsfeedUnread');
    clickedObj.find('.communicationAccordianTitle a').addClass("newsfeedRead");
    setReadClass(clickedItem);
    if (clickedObj.find('.newsfeedTitle').hasClass('newsfeedActive'))
        clickedObj.find('.newsfeedTitle').removeClass('newsfeedActive');
    else
        clickedObj.find('.newsfeedTitle').addClass('newsfeedActive');
    if (iscurrentItemRead == 0)
        NewsfeedReadItemUpdate(clickedItem, "");
}

function setReadClass(selectedItemID) {
    var JsonTemp = JSON.parse(window.sessionStorage.getItem('newsFeedPostsCollection'));
    if (JsonTemp) {
    	jsonData = JsonTemp;
    }    
    for (var iCnt = 0; iCnt < jsonData.length; iCnt++) {
        if (jsonData[iCnt]["ID"] == selectedItemID) {
            jsonData[iCnt]["FontWeight"] = "newsfeedRead";
            jsonData[iCnt]["IsRead"] = 1;
            var currentPageUrl = location.href.toLowerCase();
            if (JsonTemp) {
                window.sessionStorage.setItem('newsFeedPostsCollection', JSON.stringify(jsonData));
            }
            break;
        }
    }
    var postCategory = '';
    if (typeof objPageTitle != 'undefined') {
        switch (objPageTitle) {
            case "Front of House":
                postCategory = "FOH";
                break;
            case "Back of House":
                postCategory = "BOH";
                break;
            case "Learning":
                postCategory = "LRN";
                break;
            case "HR":
                postCategory = "HR";
                borderClass = "border-HR";
                break;
            case "Learning General":
                postCategory = "LRN General";
                break;
            case "MD Business Sales":
                postCategory = "MDBS";
                break;
            case "Programs & Events":
                postCategory = "P&E";
                break;
            case "Programs &amp; Events":
                postCategory = "P&E";
                break;
            case "Company & Culture":
                postCategory = "C&C";
                break;
            case "Company &amp; Culture":
                postCategory = "C&C";
                break;
            case "Women in Retail":
                postCategory = "W in R";
                break;
        }
        if (objPageTitle.toLowerCase() != 'home') {
            jsonData = jQuery.grep(jsonData, function (element, index) {
                return (element.Category == postCategory);
            });
        }
    }
}

function enablePaging(selection) {
	
	var jsonDataTemp;
	if(selection != 'Communications')
		jsonDataTemp = filter(jsonData, selection, '');
	else
		jsonDataTemp = jsonData;
	var rowsTotal = jsonDataTemp.length;
    var pageNum = 0;
    var currPage = 0;
    if (rowsTotal > 0) {
        var rowsShown = PageLimit;
        if ($('#navItemCount').length == 0)
            $('#newsfeedContainer').after('<div id="navItemCount"></div>');
        else
            $('#navItemCount').empty();

        $('#navItemCount').append('<span id="navItem"></span>');
        $('#navItemCount').append('<span id="pagerNav"></span>');
        var numPages = (rowsTotal / rowsShown);
        $('#navItem').append(PageLimit + ' of ' + rowsTotal);
        if (rowsTotal > PageLimit) {
            $('#pagerNav').append('<a id="PageLinkPrev" href="#" class="prev-custom-arrow ms-commandLink ms-promlink-button ms-promlink-button-enabled ms-verticalAlignMiddle" title="Move to previous page"><span class="ms-promlink-button-image"><img src="/_layouts/15/images/searchresultui.png?rev=42#ThemeKey=" class="ms-srch-pagingPrev" alt="Move to previous page"></span></a>');
            $('#PageLinkPrev').hide();
        }
        for (var i = 0; i < numPages; i++) {
            pageNum = i + 1;
            if (i == 0)
                $('#pagerNav').append('<a href="#" class="selectedPage" rel="' + (i + 1) + '">' + pageNum + '</a>');
            else
                $('#pagerNav').append('<a href="#" rel="' + (i + 1) + '">' + pageNum + '</a> ');
        }
        if (rowsTotal > PageLimit) {
            $('#pagerNav').append('<a id="PageLinkNext" href="#" class="next-custom-arrow ms-commandLink ms-promlink-button ms-promlink-button-enabled ms-verticalAlignMiddle" title="Move to next page"><span class="ms-promlink-button-image"><img src="/_layouts/15/images/searchresultui.png?rev=42#ThemeKey=" class="ms-srch-pagingNext" alt="Move to next page"></span></a>');
        }
        $('#newsfeedContainer .newsfeedItem').hide();
        $('#newsfeedContainer .newsfeedItem').slice(0, rowsShown).show();
        $('#pagerNav a').bind('click', function () { pagerClick($(this), pageNum, rowsShown, numPages, rowsTotal); });
    }
}

function pagerClick(selection, pageNum, rowsShown, numPages, rowsTotal) {
    var relValue = selection.attr('rel');
    var selectedPage;
    var pageIndex = 0;
    if (relValue == undefined) {
        selectedPage = parseInt($('#pagerNav').find('.selectedPage').attr('rel'), 20);
        var navId = selection.attr('id');
        if (navId == "PageLinkNext") {
            currPage = selectedPage + 1;
            $('#pagerNav').find('a').removeClass("selectedPage");
            $('#pagerNav').find('a[rel="' + currPage + '"]').addClass("selectedPage");
            pageIndex = currPage - 1;
            $('#PageLinkPrev').show();
        }
        else if (navId == "PageLinkPrev") {
            currPage = selectedPage - 1;
            $('#pagerNav').find('a').removeClass("selectedPage");
            $('#pagerNav').find('a[rel="' + currPage + '"]').addClass("selectedPage");
            pageIndex = currPage - 1;
        }
    }
    else {
        currPage = relValue;
        selection.parent().find('a').removeClass("selectedPage");
        selection.addClass("selectedPage");
        pageIndex = currPage - 1;
    }

    if (currPage == 1)
        $('#PageLinkPrev').hide();
    else
        $('#PageLinkPrev').show();
    if (currPage == pageNum)
        $('#PageLinkNext').hide();
    else
        $('#PageLinkNext').show();

    var startItem = pageIndex * rowsShown;
    var endItem = startItem + rowsShown;
    var itemCount;
    if (currPage < numPages - 1)
        itemCount = endItem;
    else
        itemCount = rowsTotal;
    $('#navItem').html('<span>' + itemCount + ' of ' + rowsTotal + '</span>');
    $('#newsfeedContainer .newsfeedItem').hide().slice(startItem, endItem).css('display', 'block');

	var jsonDataTemp;
    var crntSelectedTab = GetCurrentSelectedTab();
	
    if (crntSelectedTab != "Communications") {
		jsonDataTemp = filter(jsonData, crntSelectedTab, '');
    }
    else {
		jsonDataTemp = jsonData;
    }

    var pagedData = jsonDataTemp.slice(startItem, endItem);
    RenderObject(pagedData);
}

function removePaging() {
    var rowsTotal = $('#newsfeedContainer .newsfeedItem').length;
    if (rowsTotal > PageLimit) {
        $('#navItemCount').remove();
    }
}

function sortNewsfeed(selectedItem) {
    var sortParameter = selectedItem.value;
    var asc = true;
    var data;
    if (sortParameter == "PublishedDateNonFormatDsc" || sortParameter == "SortCalc")
        asc = false;
    if (activeTab == communicationType)
        data = jsonData;
    else
        data = filter(jsonData, activeTab, '');
    jsonData = data.sort(sortBy(sortParameter, asc));
    RenderObject(jsonData);

    $("#sortSection").val(sortParameter);
    $("#navItemCount").remove();
    $("#pagerNav").remove();
    
    enablePaging(GetCurrentSelectedTab());
}

function GetCurrentSelectedTab()
{
	var selectedTab ='';
    var objTabId = $('#newsfeedHdrContainer').find('.selectedCommunicationTab').attr('id');
    switch(objTabId)
    {	case "communicationTab":
			selectedTab = "Communications";
			break;
		case "TasksTab":
			selectedTab = "Task";
			break;
		case "surveyTab":
			selectedTab = "Feedback";
			break;
		default:
			selectedTab = "Communications";
			break;
    }
    return selectedTab;
}
//update user info list
function NewsfeedReadItemUpdate(itemID, postUrl) {
    var sortParam = $("#sortSection").val();
    if (IS_INITIALUNREAD || itemID == "0") {
        storeUnReadItemIds(itemID, postUrl);
        IS_INITIALUNREAD = false;
    }
    else {
		if (USER_BlogUnReadIds.indexOf((',' + itemID + ',')) > -1) {
            if (itemID) {
                getLatestUnReadItemIds(itemID, postUrl);
            }
        }
    }
    $("#sortSection").val(sortParam);
}

function getLatestUnReadItemIds(itemID, postUrl) {
    var current_UserId = _spPageContextInfo.userId;

    var context = SP.ClientContext.get_current();
    var currentWeb = context.get_web();
    var userInfoList = currentWeb.get_siteUserInfoList();

    var userInfoListItems = userInfoList.getItemById(_spPageContextInfo.userId);
    context.load(userInfoListItems);
    context.load(currentWeb, 'ServerRelativeUrl');
    context.executeQueryAsync(OnGetUnreadSuccessMethod, onGetUnreadFailureMethod);

    function OnGetUnreadSuccessMethod(sender, args) {
        current_User_Item = userInfoListItems;
        if (current_User_Item == undefined) {
            console.log('Error occured while reading User information list.');
            return;
        }
        var USER_UnReadIdsTemp = '';
        //Newsfeed Web part fields
        if (objPageTitle == "Company & Culture" || objPageTitle == "Company &amp; Culture" || objPageTitle == "Women in Retail")
            USER_UnReadIdsTemp = current_User_Item.get_item('CorpUnreadIds');
        else
            USER_UnReadIdsTemp = current_User_Item.get_item('BlogUnreadIds');

        if ((USER_UnReadIdsTemp) && USER_UnReadIdsTemp != '0#0') {
            USER_BlogUnReadIds = USER_UnReadIdsTemp;
        }

        USER_UnReadIdsTemp = current_User_Item.get_item('CorpUnreadIds');
        if ((USER_UnReadIdsTemp) && USER_UnReadIdsTemp != '0#0')
            USER_CorpUnReadIds = USER_UnReadIdsTemp;

        storeUnReadItemIds(itemID, postUrl);

        HQ_USER = current_User_Item.get_item('HQUser');

        USER_INFO_LIST = [];
        USER_INFO_LIST.push({
            "HQUser": current_User_Item.get_item('HQUser')
            , "TempAssignment": current_User_Item.get_item('TempAssignment')
            , "RetailStoreType": current_User_Item.get_item('RetailStoreType')
            , "UserStoreType": current_User_Item.get_item('UserStoreType')
            , "EDSCountry": current_User_Item.get_item('EDSCountry')
            , "UserCountry": current_User_Item.get_item('UserCountry')
            , "BlogUnreadIds": USER_BlogUnReadIds
            , "CorpUnreadIds": USER_CorpUnReadIds
            , "Acknowledgement": current_User_Item.get_item('Acknowledgement')
        });

        window.sessionStorage.setItem('USER_INFO_LIST', JSON.stringify(USER_INFO_LIST));
    }

    function onGetUnreadFailureMethod(sender, args) {
        console.log('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
    }
}

function storeUnReadItemIds(itemID, postUrl) {
    var postUrl = postUrl;
    var clientContext = SP.ClientContext.get_current();
    var oList = clientContext.get_web().get_siteUserInfoList();
    this.oListItem = oList.getItemById(_spPageContextInfo.userId);

    var blogReadIdsTemp = "";
    blogReadIdsTemp = USER_BlogUnReadIds.replace((',' + itemID + ','), ',');

    var maxReadItemId = blogReadIdsTemp.split('#')[0];
    if (parseInt(itemID) > parseInt(maxReadItemId)) {
        blogReadIdsTemp = blogReadIdsTemp.replace(maxReadItemId, itemID);
    }

    if (objPageTitle == "Company & Culture" || objPageTitle == "Company &amp; Culture" || objPageTitle == "Women in Retail")
        this.oListItem.set_item('CorpUnreadIds', blogReadIdsTemp);
    else
        this.oListItem.set_item('BlogUnreadIds', blogReadIdsTemp);

    this.oListItem.update();
    clientContext.executeQueryAsync(onReadItemSucceeded, onReadItemUpdateFailed);

    function onReadItemSucceeded(sender, args) {
        USER_BlogUnReadIds = blogReadIdsTemp;

        var USER_INFO_LIST = JSON.parse(window.sessionStorage.getItem('USER_INFO_LIST'));
        if (USER_INFO_LIST) {
            USER_INFO_LIST[0]["BlogUnreadIds"] = USER_BlogUnReadIds
            window.sessionStorage.setItem('USER_INFO_LIST', JSON.stringify(USER_INFO_LIST));
        }
        console.log('Item updated as READ successfully!')

        bindHeaderDataToTemplate(activeTab, true);

        if (postUrl != undefined && postUrl != "") {
            window.open(postUrl, '_self');
        }
    }
    function onReadItemUpdateFailed(sender, args) {
        console.log('Item failed to update as Read Item!')
    }
}

function onGetUnreadFailureMethod() {
    console.log("Error")
}


function sortBy(prop, asc) {
    return function (a, b) {
        if (asc)
            return (a[prop] > b[prop]) ? 1 : ((a[prop] < b[prop]) ? -1 : 0);
        else
            return (b[prop] > a[prop]) ? 1 : ((b[prop] < a[prop]) ? -1 : 0);
    }
}

function rebindDataToTemplate(template, appendTo, data) {
    $(appendTo).empty();
    if (data.length == 0) {
        data = [{ "Message": "No Newsfeeds found" }];
        $("#" + blanktemplateId).tmpl(data).appendTo(appendTo);
    }
    else if (data[0].Message == "No Newsfeeds found")
        $("#" + blanktemplateId).tmpl(data).appendTo(appendTo);
    else
        $(template).tmpl(data).appendTo(appendTo);
}


function refreshDataMob(selection) {
    var objVal = $(selection).val();
    if (objVal != undefined && objVal != "") refreshData(objVal);
}

function refreshData(selection) {
    activeTab = selection;
    removePaging();
    var data;
    jsonData.sort(sortBy("SortCalc", false));

    if (selection != communicationType) {
        data = filter(jsonData, selection, '');
    }
    else {
        data = jsonData;
    }
    RenderObject(data);
    enablePaging(selection);
    bindHeaderDataToTemplate(selection, true);
}

function bindHeaderDataToTemplate(postType, isFullQuery) {
    var headerData = [];
    var unreadData = [];
    activeTab = postType;
var postCategory = '';
   if(typeof objPageTitle != 'undefined')
			{
			    switch (objPageTitle) {
                    case "Front of House":
                        postCategory = "FOH";
                        break;
                    case "Back of House":
                        postCategory = "BOH";
                        break;
                    case "Learning":
                        postCategory = "LRN";
                        break;
                    case "HR":
                        postCategory = "HR";
                        borderClass = "border-HR";
                        break;
                    case "Learning General":
                        postCategory = "LRN General";
                        break;
                    case "MD Business Sales":
                        postCategory = "MDBS";
                        break;
                    case "Programs & Events":
                        postCategory = "P&E";
                        break;
                    case "Programs &amp; Events":
                        postCategory = "P&E";
                        break;
                    case "Company & Culture":
                        postCategory = "C&C";
                        break;
                    case "Company &amp; Culture":
                        postCategory = "C&C";
                        break;
                    case "Women in Retail":
                        postCategory = "W in R";
                        break;
                }
             }
			
    var tasks = filter(jsonData, taskType, postCategory);
    var feedBacks = filter(jsonData, feedbackType, postCategory);
    var unreadTaskCount = ($.map(tasks, function (item) { if (!item.IsRead) return item.ID; })).length;
    var unreadCommCount = ($.map(jsonData, function (item) { if (!item.IsRead) return item.ID; })).length;
    var unreadFeedbackCount = ($.map(feedBacks, function (item) { if (!item.IsRead) return item.ID; })).length;

    if (postType == communicationType)
        unreadData = unreadCommCount;
    else if (postType == taskType)
        unreadData = unreadTaskCount;
    else if (postType == feedbackType)
        unreadData = unreadFeedbackCount;

    var cssCommSelect = '', cssTaskSelect = '', cssFeedbackSelect = '';
    var htmlSelect = '';
    
    if (objPageTitle == "Company & Culture" || objPageTitle == "Company &amp; Culture" || objPageTitle == "Women in Retail")
	{}
	else
    {
	    switch (activeTab) {
	        case "Communications":
	            htmlSelect += "<option value='Communications' selected>Communications</option>";
	            htmlSelect += "<option value='Task'>Tasks</option>";
	            htmlSelect += "<option value='Feedback'>Surveys</option>";
	            cssCommSelect = 'selectedCommunicationTab';
	            break;
	        case "Task":
	            htmlSelect += "<option value='Communications'>Communications</option>";
	            htmlSelect += "<option value='Task' selected>Tasks</option>";
	            htmlSelect += "<option value='Feedback'>Surveys</option>";
	            cssTaskSelect = 'selectedCommunicationTab';
	            break;
	        case "Feedback":
	            htmlSelect += "<option value='Communications'>Communications</option>";
	            htmlSelect += "<option value='Task'>Tasks</option>";
	            htmlSelect += "<option value='Feedback' selected>Surveys</option>";
	            cssFeedbackSelect = 'selectedCommunicationTab'
	            break;
	        default:
	            htmlSelect += "<option value='Communications' selected>Communications</option>";
	            htmlSelect += "<option value='Task'>Tasks</option>";
	            htmlSelect += "<option value='Feedback'>Surveys</option>";
	            cssCommSelect = 'selectedCommunicationTab';
	            break;
	    }
    }
    var html = '';
	if (objPageTitle == "Company & Culture" || objPageTitle == "Company &amp; Culture" || objPageTitle == "Women in Retail")
	{}
	else
    {
	var html = '<div id="communicationTab" class="' + cssCommSelect + '" style="cursor:pointer" onclick="refreshData(\'Communications\')">';
	    html += "<span>Communications</span>";
	    html += "<span class='itemCount'>(" + unreadCommCount + ")</span>";
	    html += "</div>";
    	html += '<div id="TasksTab" class="' + cssTaskSelect + '" style="cursor:pointer" onclick="refreshData(\'Task\')">';
	    html += "<span>Tasks</span>";
	    html += "<span class='itemCount'>(" + unreadTaskCount + ")</span>";
	    html += "</div>";
	    html += '<div id="surveyTab" class="' + cssFeedbackSelect + '" style="cursor:pointer" onclick="refreshData(\'Feedback\')">';
	    html += "<span>Surveys</span>";
	    html += "<span class='itemCount'>(" + unreadFeedbackCount + ")</span>";
	    html += "</div>";
    }
    
    if (objPageTitle == "Company & Culture" || objPageTitle == "Company &amp; Culture" || objPageTitle == "Women in Retail")
		html += "<div class='NewsfeedTabsMobContainer NewsfeedTabsMobContainerCorp'>";
    else
    	html += "<div class='NewsfeedTabsMobContainer'>";
    
    html += "<select id='NewsfeedTabsMob' onchange='refreshDataMob(this)'>";
    html += htmlSelect;
    html += "</select>";
    html += "</div>";
    html += "<select id='sortSection' class='sortSectionCorp' onchange='sortNewsfeed(this)'>";
    html += "<option value='SortCalc'>Default</option>";
    html += "<option value='PublishedDateNonFormatDsc'>Date(Newest)</option>";
    html += "<option value='PublishedDateNonFormatAsc'>Date(Oldest)</option>";
    html += "<option value='Title'>Title</option>";
    html += "<option value='Category'>Category</option>";
    html += "</select>";
    html += "<span class='sortHeader'>Sort By</span>";
    html += "<div class='unreadSeperator'>" + unreadData + " Unread " + postType + " </div>";

    $('#newsfeedHdrContainer').html(html);
    if(isFullQuery)
    {
	    $('span.itemCount, .unreadSeperator').show();
    }
}