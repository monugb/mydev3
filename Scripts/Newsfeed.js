var viewFields = "<ViewFields><FieldRef Name='ID' /><FieldRef Name='Title'/><FieldRef Name='PostCategory'/><FieldRef Name='PostType'/><FieldRef Name='PublishedDate'/><FieldRef Name='NumComments'/><FieldRef Name='Body'/><FieldRef Name='SortCalc'/><FieldRef Name='Country'/><FieldRef Name='StoreType'/><FieldRef Name='LikesCount'/><FieldRef Name='LikedBy'/><FieldRef Name='OrigPubDate'/></ViewFields>";
var listName = 'Posts';
var webpartName = 'Newsfeed';
var templateId = 'newsfeedTemplate';
var containerId = 'newsfeedContainer';
var blanktemplateId = 'emptyNewsfeedTemplate';

var sortParamPrev = "";
var communicationType = "Communications";
var taskType = "Task";
var feedbackType = "Feedback";
var PageLimit = 20;

var currentUserEmail;
var activeTab;
var subsiteName;
var users = new Array();

$(document).ready(function () {
    try {
        if (objPageTitle == "Company & Culture" || objPageTitle == "Company &amp; Culture" || objPageTitle == "Women in Retail") {
            sessionStorage.removeItem(storageKey);
            sessionStorage.removeItem(USER_INFO_SESSSION_KEY);
        }
        $.getScript(_spPageContextInfo.siteAbsoluteUrl + "/Style%20Library/StorePortal/Scripts/jquery.tmpl.js");
        GetCountryAndStoreFilter(0);
        if (_spPageContextInfo) {
            if (_spPageContextInfo.serverRequestPath.toLowerCase().indexOf('pages/home.aspx') > 0) {
                RemoveDuplicateRetailLinks();
            }
        }
    }
    catch (ex) {
        console.log("Error: " + ex.message);
    }
});

function RemoveDuplicateRetailLinks() {
    try {
        var qryCountry = '<Neq><FieldRef Name="Country" /><Value Type="TaxonomyFieldTypeMulti"></Value></Neq>';
        var qryStoreType = '<Neq><FieldRef Name="StoreType" /><Value Type="TaxonomyFieldTypeMulti"></Value></Neq>';

        if (!HQ_USER) {
            if (USER_COUNTRY)
                qryCountry = '<Eq><FieldRef Name="Country" /><Value Type="TaxonomyFieldTypeMulti">' + USER_COUNTRY + '</Value></Eq>';
            if (USER_STORETYPE)
                qryStoreType = '<Eq><FieldRef Name="StoreType" /><Value Type="TaxonomyFieldTypeMulti">' + USER_STORETYPE + '</Value></Eq>';
        }

        var retailCategory = '';
        if (typeof objPageTitle == null)
            retailCategory = 'Home';
        else
            retailCategory = objPageTitle;

        var queryText = '<View><Query><Where>'
            + '<And>'
            + '<Eq><FieldRef Name="Retail_x0020_Category" /><Value Type="TaxonomyFieldTypeMulti">' + retailCategory + '</Value></Eq>'
            + '<And>'
            + qryCountry
            + qryStoreType
            + '</And>'
            + '</And>'
            + '</Where></Query>';
        queryText += "<ViewFields><FieldRef Name='Title'/><FieldRef Name='URL'/></ViewFields>";
        queryText += '</View>';

        //Adding RestApi Methods
        getListItemsAsStream(_spPageContextInfo.siteAbsoluteUrl, 'Retail Links', queryText, OnGetUnreadSuccessMethod, onGetUnreadFailureMethod);
        function OnGetUnreadSuccessMethod(dataResults) {
            var linkExist = false;
            var retailLinkItems = [];

            $.each(dataResults, function (index, value) {
                var title = value.Title;
                var itemUrl = value.URL;
                var itemDescription = value["URL.desc"];	

                retailLinkItems.push({
                    "Href": itemUrl,
                    "Title": itemDescription 
                });
            });

            $('#quickLinkWp a').each(function () {
                var linkItem = $(this);
                var objHref = linkItem.attr('href');
                var objTitle = linkItem.text();

                linkExist = false;
                for (var iCnt = 0; iCnt < retailLinkItems.length; iCnt++) {
                    if (objTitle == retailLinkItems[iCnt]["Title"] && objHref == retailLinkItems[iCnt]["Href"]) {
                        linkExist = true;
                        break;
                    }
                }
                if (!linkExist) {
                    linkItem.parent().hide();
                }
            });
        }
        function onGetUnreadFailureMethod(jqXHR, textStatus, error) {
            console.log('Request failed \n Error Message : ' + error);
            try {
                $('#loaderImageQuickLinks').hide();
            }
            catch (ex) { console.log(ex.message); }
            $('#quickLinkWp').show();
        }
    }
    catch (ex) {
        console.log("Error : " + ex.message);
    }
}

function openNewsfeed(obj, event, selectedItemId, isRead) {
    try {
        obj.removeClass('newsfeedUnread');
        obj[0].className = "newsfeedRead";
        event.stopPropagation();
    }
    catch (ex) {
        console.log("Error : " + ex.message);
    }
}

function GetCountryAndStoreFilter(counter) {
    try {
        if (typeof HQ_USER == 'undefined') {
            if (counter < 20)
                setTimeout(function () { GetCountryAndStoreFilter(counter++); }, 300);
        }
        else {
            if (objPageTitle == "Company & Culture" || objPageTitle == "Company &amp; Culture" || objPageTitle == "Women in Retail")
                subsiteName = 'corporate';
            else
                subsiteName = 'Blog';

            if (objPageTitle == "Windows 10") {
                objPageTitle = "Win10";
            }
            //console.log("End - Called GetCountryAndStoreFilter(counter): " + new Date());
            GetReadItemsFromUserInfo(0);
        }
    }
    catch (err) {
        console.log("Error:" + err.message);
    }
}

function GetReadItemsFromUserInfo(counter) {
    try {
        if (typeof USER_BlogUnReadIds == 'undefined') {
            if (counter < 10)
                setTimeout(function () { GetReadItemsFromUserInfo(counter++); }, 300);
        }
        else {
            GetNewsfeeds(true, false);
        }
    }
    catch (ex) {
        console.log("Error : " + ex.message);
    }
}

function GetNewsfeeds(isCached, isQueryFull) {
    try {
        var qryPostCatg = "";
        qryCountry = '<Neq><FieldRef Name="Country" /><Value Type="TaxonomyFieldTypeMulti"></Value></Neq>';
        qryStoreType = '<Neq><FieldRef Name="StoreType" /><Value Type="TaxonomyFieldTypeMulti"></Value></Neq>';

        var qryStoreNumber = "";
        var qryRetailRole = "";

        if (!HQ_USER) {
            if (USER_COUNTRY)
                qryCountry = '<Eq><FieldRef Name="Country" /><Value Type="TaxonomyFieldTypeMulti">' + USER_COUNTRY + '</Value></Eq>';
            if (USER_STORETYPE)
                qryStoreType = '<Eq><FieldRef Name="StoreType" /><Value Type="TaxonomyFieldTypeMulti">' + USER_STORETYPE + '</Value></Eq>';

            //Adding query filter for store number and retail role
            if (USER_STORENUMBER) {
                qryStoreNumber = '<Or>'
                    + '<IsNull><FieldRef Name="StoreNumber"/></IsNull>'
                    + '<Eq><FieldRef Name="StoreNumber" /><Value Type="TaxonomyFieldTypeMulti">' + USER_STORENUMBER + '</Value></Eq>'
                    + '</Or>';
            }
            if (USER_RETAILROLE) {
                qryRetailRole = '<Or>'
                    + '<IsNull><FieldRef Name="RetailRole"/></IsNull>'
                    + '<Eq><FieldRef Name="RetailRole" /><Value Type="TaxonomyFieldTypeMulti">' + USER_RETAILROLE + '</Value></Eq>'
                    + '</Or>';
            }
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
        else if (objPageTitle == "Virtual Reality") {
            objPageTitle = "VR";
            qryPostCatg = '<Or><Eq><FieldRef Name="PostCategory" /><Value Type="LookupMulti">' + objPageTitle + '</Value></Eq>'
                + '<Eq><FieldRef Name="ProductCategory" /><Value Type="TaxonomyFieldType">' + objPageTitle + '</Value></Eq></Or>';
        }
        else if (objPageTitle == "Windows 10") {
            qryPostCatg = '<Or>'
                + '<Eq><FieldRef Name="ProductCategory" /><Value Type="TaxonomyFieldType">Windows</Value></Eq>'
                + '<Eq><FieldRef Name="Product" /><Value Type="TaxonomyFieldType">Win10</Value></Eq>'
                + '</Or>';
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
            + qryStoreType;

        if (qryStoreNumber != '') {
            queryText += '<And>';
            queryText += qryStoreNumber;
        }

        if (qryRetailRole != '') {
            queryText += '<And>';
            queryText += qryRetailRole;
        }
        queryText += qryPostCatg;

        if (qryStoreNumber != '')
            queryText += '</And>';

        if (qryRetailRole != '')
            queryText += '</And>';

        queryText += '</And>'
        queryText += '</And>'
        queryText += '</And>'
        queryText += '</And>'
        queryText += '</And>'
        queryText += '</Where><OrderBy><FieldRef Name="SortCalc" Ascending="False" /></OrderBy></Query>';
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
    catch (err) {
        console.log("Error" + err.message);
    }
}

function toggleDesc(clickedObj, clickedItem) {
    try {
        if ($(clickedObj).attr("id") == "newsfeedFooterCtrl") {
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            else {
                event.cancelBubble = true;
            }
        }
        var iscurrentItemRead = clickedObj.find('a.newsfeedRead').length;
        clickedObj.find('.newsFeedGeneric').toggle();
        //clickedObj.find('.newsFeedGeneric').show();
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
    catch (err) {
        console.log("Error: " + err.message);
    }
}

function setReadClass(selectedItemID) {
    try {
        var jsonDataTemp = JSON.parse(sessionStorage.getItem(storageKey));
        if (jsonDataTemp) {
            jsonData = jsonDataTemp.content;
        }
        for (var iCnt = 0; iCnt < jsonData.length; iCnt++) {
            if (jsonData[iCnt]["ID"] == selectedItemID) {
                jsonData[iCnt]["FontWeight"] = "newsfeedRead";
                jsonData[iCnt]["IsRead"] = 1;
                var currentPageUrl = location.href.toLowerCase();
                if (jsonDataTemp) {
                    var timeStampObj = JSON.parse(sessionStorage.getItem(storageKey));
                    if (timeStampObj) {
                        timeStampObj = timeStampObj.timestamp;
                    }
                    else { timeStampObj = new Date(); }
                    sessionStorage.setItem(storageKey, JSON.stringify({
                        timestamp: timeStampObj,
                        content: jsonData
                    }));
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
    catch (err) {
        console.log("Error: " + err.message);
    }
}

function enablePaging(selection) {
    try {
        var jsonDataTemp;
        if (selection != 'Communications')
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
    catch (err) {
        console.log("Error: " + err.message);
    }
}

function pagerClick(selection, pageNum, rowsShown, numPages, rowsTotal) {
    try {
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
        var pagedData = [];
        var sortParameter = $('#sortSection').val();
        if (sortParameter == 'IsRead')
            jsonDataTemp = sortbyUnreadItems(jsonDataTemp);
        else {
            var asc = true;
            if (sortParameter == "PublishedDateNonFormatDsc" || sortParameter == "SortCalc")
                asc = false;
            jsonDataTemp = jsonDataTemp.sort(sortBy(sortParameter, asc));
        }
        pagedData = jsonDataTemp.slice(startItem, endItem);
        RenderObject(pagedData);
    }
    catch (err) {
        console.log("Error: " + err.message);
    }
}

function removePaging() {
    var rowsTotal = $('#newsfeedContainer .newsfeedItem').length;
    if (rowsTotal > PageLimit) {
        $('#navItemCount').remove();
    }
}

function sortNewsfeed(selectedItem) {
    try {
        var sortParameter = $(selectedItem).val();
        var asc = true;
        var data;
        if (sortParameter == "PublishedDateNonFormatDsc" || sortParameter == "SortCalc")
            asc = false;
        if (activeTab == communicationType)
            data = jsonData;
        else
            data = filter(jsonData, activeTab, '');

        //New functionality added on requirement
        // New sory by option for UnRead items added in dropdown
        // Sort by for Unread Items: {Unread + Default sort(Sortcalc)}
        var sortedData = [];
        if (sortParameter == 'IsRead') {
            sortedData = sortbyUnreadItems(data);
            if (activeTab == communicationType)
                jsonData = sortedData;
        }
        else {
			var sortParameter1= sortParameter;
        	if(sortParameter == "PublishedDateNonFormatDsc"){ sortParameter1 = "PublishedDateNonFormatAsc";}
            sortedData = data.sort(sortBy(sortParameter1, asc));
        }
        RenderObject(sortedData);

        $("#sortSection").val(sortParameter);
        $("#navItemCount").remove();
        $("#pagerNav").remove();

        enablePaging(GetCurrentSelectedTab());
    }
    catch (err) {
        console.log("Error: " + err.message);
    }

}

function sortbyUnreadItems(data) {
    try {
        var dataRead = data.filter(function (i, n) {
            return i.IsRead == '1';
        });

        var dataUnRead = data.filter(function (i, n) {
            return i.IsRead == '0';
        });
        var dataUnReadSorted = dataUnRead.sort(sortBy("SortCalc", false));

        return dataUnReadSorted.concat(dataRead);
    }
    catch (err) {
        console.log("Error: " + err.message);
    }
}

function GetCurrentSelectedTab() {
    try {
        var selectedTab = '';
        var objTabId = $('#newsfeedHdrContainer').find('.selectedCommunicationTab').attr('id');
        switch (objTabId) {
            case "communicationTab":
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
    catch (err) {
        console.log("Error: " + err.message);
    }

}
//update user info list
function NewsfeedReadItemUpdate(itemID, postUrl) {
    try {
        sortParamPrev = $("#sortSection").val();
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
        $("#sortSection").val(sortParamPrev);
    }
    catch (err) {
        console.log("Error: " + err.message);
    }
}

function getLatestUnReadItemIds(itemID, postUrl) {
    try {
        //Adding REST API Methods
        var camlQuery = "<View><Query><Where><Eq><FieldRef Name='ID' /><Value Type='Counter'>" + _spPageContextInfo.userId + "</Value></Eq></Where></Query></View>";
        getListItemsAsStream(_spPageContextInfo.siteAbsoluteUrl, USER_INFORMATION_LIST, camlQuery, OnGetUnreadSuccessMethod, onGetUnreadFailureMethod)

        function OnGetUnreadSuccessMethod(dataResults) {
            current_User_Item = dataResults[0];//Since only one List Item will be returned.
            if (current_User_Item == undefined) {
                console.log('Error occured while reading User information list.');
                return;
            }
            var USER_UnReadIdsTemp = '';
            //Newsfeed Web part fields
            if (objPageTitle == "Company & Culture" || objPageTitle == "Company &amp; Culture" || objPageTitle == "Women in Retail")
                USER_UnReadIdsTemp = current_User_Item.CorpUnreadIds;
            else
                USER_UnReadIdsTemp = current_User_Item.BlogUnreadIds;

            if ((USER_UnReadIdsTemp) && USER_UnReadIdsTemp != '0#0') {
                USER_BlogUnReadIds = USER_UnReadIdsTemp;
            }

            USER_UnReadIdsTemp = current_User_Item.CorpUnreadIds;
            if ((USER_UnReadIdsTemp) && USER_UnReadIdsTemp != '0#0')
                USER_CorpUnReadIds = USER_UnReadIdsTemp;

            storeUnReadItemIds(itemID, postUrl);

            HQ_USER = (current_User_Item.HQUser == "Yes" || current_User_Item.HQUser == "True") ? true : false;

            USER_INFO_LIST = [];
            USER_INFO_LIST.push({
                "HQUser": HQ_USER
                , "TempAssignment": (current_User_Item.TempAssignment == 'Yes' || current_User_Item.TempAssignment == 'True') ? true : false
                , "RetailStoreType": current_User_Item.RetailStoreType
                , "UserStoreType": current_User_Item.UserStoreType
                , "EDSCountry": current_User_Item.EDSCountry
                , "UserCountry": current_User_Item.UserCountry
                , "BlogUnreadIds": USER_BlogUnReadIds
                , "CorpUnreadIds": USER_CorpUnReadIds
                , "Acknowledgement": (current_User_Item.Acknowledgement == "Yes" || current_User_Item.Acknowledgement == "True") ? true : false
            });
            sessionStorage.setItem(USER_INFO_SESSSION_KEY, JSON.stringify({
                timestamp: new Date(),
                content: USER_INFO_LIST
            }));
        }

        function onGetUnreadFailureMethod(jqXHR, textStatus, error) {
            console.log('Request failed \n Error Message : ' + error);
        }
    }
    catch (err) {
        console.log("Error: " + err.message);
    }
}

function storeUnReadItemIds(itemID, postUrl) {
    try {
        //Adding REST API Methods
        var postMetadata;
        var blogReadIdsTemp = "";
        blogReadIdsTemp = USER_BlogUnReadIds.replace((',' + itemID + ','), ',');

        var maxReadItemId = blogReadIdsTemp.split('#')[0];
        if (parseInt(itemID) > parseInt(maxReadItemId)) {
            blogReadIdsTemp = blogReadIdsTemp.replace(maxReadItemId, itemID);
        }
        if (objPageTitle == "Company & Culture" || objPageTitle == "Company &amp; Culture" || objPageTitle == "Women in Retail")
            postMetadata = { "CorpUnreadIds": blogReadIdsTemp };
        else
            postMetadata = { "BlogUnreadIds": blogReadIdsTemp };

        var query = "?$filter=ID eq " + _spPageContextInfo.userId + "&$select=CorpUnreadIds,BlogUnreadIds";//"(" + _spPageContextInfo.userId + ")";
        updateListItem(_spPageContextInfo.siteAbsoluteUrl, USER_INFORMATION_LIST, query, postMetadata, onReadItemSucceeded, onReadItemUpdateFailed);

        function onReadItemSucceeded(dataResults) {
            USER_BlogUnReadIds = blogReadIdsTemp;

            var userInfoList = JSON.parse(sessionStorage.getItem(USER_INFO_SESSSION_KEY));
            if (userInfoList) {
                var timeStmp = userInfoList.timestamp;
                userInfoList = userInfoList.content;
                if (userInfoList.length > 0) {
                    userInfoList[0]["BlogUnreadIds"] = USER_BlogUnReadIds;
                    sessionStorage.setItem(USER_INFO_SESSSION_KEY, JSON.stringify({
                        timestamp: timeStmp,
                        content: userInfoList
                    }));
                }
            }
            bindHeaderDataToTemplate(activeTab, true);
            $("#sortSection").val(sortParamPrev);

            if (postUrl != undefined && postUrl != "") {
                window.open(postUrl, '_self');
            }
        }
        function onReadItemUpdateFailed(jqXHR, textStatus, error) {
            console.log('Item failed to update as Read Item! \n Error Message : ' + error);
        }
    }
    catch (err) {
        console.log("Error: " + err.message);
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
    try {
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
    catch (ex) {
        console.log("Error : " + ex.message);
    }
}


function refreshDataMob(selection) {
    var objVal = $(selection).val();
    if (objVal != undefined && objVal != "") refreshData(objVal);
}

function refreshData(selection) {
    try {
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
    catch (ex) {
        console.log("Error : " + ex.message);
    }
}

function bindHeaderDataToTemplate(postType, isFullQuery) {
    try {
        var headerData = [];
        var unreadData = [];
        activeTab = postType;
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
        { }
        else {
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
        { }
        else {
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
        html += "<option value='IsRead'>Unread first</option>";
        html += "<option value='PublishedDateNonFormatDsc'>Date(Newest)</option>";
        html += "<option value='PublishedDateNonFormatAsc'>Date(Oldest)</option>";
        html += "<option value='Title'>Title</option>";
        html += "<option value='Category'>Category</option>";
        html += "</select>";
        html += "<span class='sortHeader'>Sort By</span>";
        html += "<div class='unreadSeperator'>" + unreadData + " Unread " + postType + " </div>";

        $('#newsfeedHdrContainer').html(html);
        if (isFullQuery) {
            $('span.itemCount, .unreadSeperator').show();
        }
    }
    catch (err) {
        console.log("Error: " + err.message);
    }
}

function postUserComments(objComment, itemId) {
    try {
        var htmlComments = "<div id='commentContainer' class='ms-blog-postList1'><textarea id='CommentTextBox' class='ms-comm-postReplyTextBox postCommentsTextArea' />"
            + "<div><div class='ms-floatRight'>"
            + "<input id='CommentSubmit' class='ms-button-emphasize ms-floatRight' type='button' onclick='submitPost(this, " + itemId + ")' value='Post'/>"
            + "</div></div></div>";

        $(objComment).parent().find('div[id=commentContainer]').remove();
        $(objComment).after(htmlComments);
    }
    catch (ex) {
        console.log("Error : " + ex.message);
    }
}

function submitPost(objPostSubmit, itemId) {
    try {
        $(objPostSubmit).attr('disabled', 'disabled');

        //REST API Call
        var listName = "Posts";
        var url = _spPageContextInfo.siteAbsoluteUrl + '/blog';
        var camlQuery = "<View><Query><Where><Eq><FieldRef Name='ID' /><Value Type='Counter'>" + itemId + "</Value></Eq></Where></Query></View>";
        getListItemsAsStream(url, listName, camlQuery, onSuccessSubmitPost, onFailureSubmitPost);

        function onSuccessSubmitPost(dataResults) {
            createMessage(objPostSubmit, dataResults[0], url);
        }
        function onFailureSubmitPost(jqXHR, textStatus, error) {
            console.log('Request failed \n Error Message : ' + error);
        }
    }
    catch (err) {
        console.log("Error: " + err.message);
    }
}

var postId = 0;
function createMessage(objPostSubmit, discussionItem, url) {
    try {
        postId = discussionItem.ID;
        var userComment = $('#CommentTextBox').val();
        var postTitle = postId + ';#' + discussionItem.Title;
//        var newItemMetadata = { "Title": userComment, "Body": userComment, "PostTitle": postTitle };
        var newItemMetadata = { "Title": userComment, "Body": userComment, "PostTitleId": postId };
        createNewListItem(url, 'Comments', newItemMetadata, onCreateMessageSuccess, onCreateMessageFailure);

        function onCreateMessageSuccess(dataResults) {
            //OnItemAdded(messageItem); 
            console.log('comments submitted successfully');
            var jsonDataTemp = JSON.parse(sessionStorage.getItem(storageKey));
            if (jsonDataTemp) {
                jsonData = jsonDataTemp.content;
            }
            var postCommentsCount = 0;
            jsonData.filter(function (i, n) {
                if (i.ID == postId) { postCommentsCount = parseInt(i.CommentsCount) + 1; i.CommentsCount = postCommentsCount; }
            })
            //sessionStorage.setItem(storageKey, JSON.stringify(jsonData));
            var timeStampObj = JSON.parse(sessionStorage.getItem(storageKey));
            if (timeStampObj) {
                timeStampObj = timeStampObj.timestamp;
            }
            else { timeStampObj = new Date(); }
            sessionStorage.setItem(storageKey, JSON.stringify({
                timestamp: timeStampObj,
                content: jsonData
            }));

            //$('#PostCommentCount a').text(postCommentsCount + ' Comments');
            $('#numComments_' + postId).text(postCommentsCount);
            $('#commentContainer').remove();
        }
        function onCreateMessageFailure(jqXHR, textStatus, error) {
            console.log('Request failed \n Error Message : ' + error);
        }
    }
    catch (err) {
        console.log("Error: " + err.message);
    }
}

function UpdateDiscussionLikedBy(objLike) {
    try {
        var IsLike = false;
        if ($(objLike).text() == "Like") {
            IsLike = true;
        }

        var userArr = [];
        var postUsrArr = [];
        var objuser = {};

        //JSOM Code Commented  To be replaced with REST API
        /*var context = new SP.ClientContext(_spPageContextInfo.siteAbsoluteUrl + '/blog');
        var web = context.get_web();
        var list = web.get_lists().getByTitle('Posts');
        var itemID = $(objLike).attr('id');
        itemID = itemID.replace('likesElement-', '');
        var item = list.getItemById(itemID);
        context.load(item, "LikedBy", "ID", "LikesCount");*/

        //////
        var itemID = $(objLike).attr('id');
        itemID = itemID.replace('likesElement-', '');
        var url = _spPageContextInfo.siteAbsoluteUrl + '/blog';
        var query = "?$filter=Id eq " + itemID + "&$select=Id,LikesCount,LikedByStringId,OData__ModerationStatus";
		var listname = 'Posts';
		
        var jsonDataTemp = JSON.parse(sessionStorage.getItem(storageKey));
        jsonDataTemp = jsonDataTemp.content;
        jsonDataTemp.filter(function(i, n) {
            if (i.ID == itemID) {
                userArr = i.LikedBy;
            }
        });
        
        getListItems(url, listname, query, function(data){
        	userArr = data.d.LikedByStringId.results;        
	        $.each(userArr, function (index, value) {
	            var userId = value;
	            if (IsLike) {
	                if (userId != _spPageContextInfo.userId) {
	                    objuser = {};
	                    objuser.id = userId;
	                    postUsrArr.push(objuser);
	                }
	            }
	            else {
	                if (userId != _spPageContextInfo.userId) {
	                    objuser = {};
	                    objuser.id = userId;
	                    postUsrArr.push(objuser);
	                }
	            }
	        });
	        if (IsLike) {
	            objuser = {};
	            objuser.id = _spPageContextInfo.userId.toString();
	            postUsrArr.push(objuser);
	        }
	        var Ids = [];
	        $.each(postUsrArr, function (i, v) {
	            Ids.push(v.id.toString());
	        });
	        var likesMetadata = {};
	        likesMetadata.LikesCount = postUsrArr.length;
	        likesMetadata.LikedByStringId = {};
	        likesMetadata.LikedByStringId.results = Ids;
	        likesMetadata.LikedByStringId.__metadata = {};
	        likesMetadata.LikedByStringId.__metadata.type = "Collection(Edm.String)";
	        likesMetadata.OData__ModerationStatus = 0;
	        updateListItem(url, listname, query, likesMetadata, onUpdateItemSuccess, onUpdateItemFailed);
        },
        function(jqXHR, textStatus, error) {
            console.log('Request failed \n Error Message : ' + error);
        });
        //////


        /*context.executeQueryAsync(Function.createDelegate(this, function (success) {
            var likesCount = item.get_item('LikesCount');//item.LikesCount;
            var $v_0 = item.get_item('LikedBy');//item.LikedBy;
            if (!SP.ScriptHelpers.isNullOrUndefined($v_0)) {
                var userAlias = '';
                users = new Array();
                for (var $v_1 = 0, $v_2 = $v_0.length; $v_1 < $v_2; $v_1++) {
                    var $v_3 = $v_0[$v_1];
                    userAlias = item.get_item('LikedBy')[$v_1].get_email();//item.LikedBy[$v_1].get_email();
                    if (userAlias == $v_3.$5_2) {
   	                    var userId = item.get_item('LikedBy')[$v_1].get_lookupId();
                        if (IsLike) {
                            if (userId != _spPageContextInfo.userId) {
                                users.push(SP.FieldUserValue.fromUser(userAlias));
                                objuser.email = userAlias;
                                objuser.id = userId;
                                userArr.push(objuser);
                            }
                        }
                        else {
                            if (userId != _spPageContextInfo.userId) {
                                users.push(SP.FieldUserValue.fromUser(userAlias));
                                objuser.email = userAlias;
                                objuser.id = userId;
                                userArr.push(objuser);
                            }
                        }
                    }
                }
            }
            if (IsLike) {
                users.push(SP.FieldUserValue.fromUser(_spPageContextInfo.userLoginName));
                objuser.email = _spPageContextInfo.userLoginName;
				objuser.id = _spPageContextInfo.userId;
				userArr.push(objuser);
            }
            item.set_item('LikedBy', users);
            item.set_item('LikesCount', users.length);
            item.set_item('_ModerationStatus', 0);

            item.update();
            context.load(item);
            context.executeQueryAsync(onUpdateItemSuccess, onUpdateItemFailed);


        }),
            Function.createDelegate(this, function (sender, args) {
                //Custom error handling if needed 
                console.log('Error');
            }));*/

        //function onUpdateItemSuccess(dataResults) {
        function onUpdateItemSuccess(d) {
            console.log('Item has been successfully updated in Post List');
            if ($(objLike).text() == "Like") {
                $(objLike).text('Unlike');
            }
            else {
                $(objLike).text('Like');
            }
            $(objLike).parent().find('.ms-comm-reputationNumbers').text(postUsrArr.length);//users.length);

            var itemId = $(objLike).attr('id');
            itemId = itemID.replace('likesElement-', '');

            var jsonDataTemp = JSON.parse(sessionStorage.getItem(storageKey));
            if (jsonDataTemp) {
                jsonData = jsonDataTemp.content;
            }

            jsonData.filter(function(i, n) {
                if (i.ID == itemId) {
                    i.LikesCount = postUsrArr.length; //users.length; 
                    //i.LikedBy = users; 
                    i.LikedBy = postUsrArr; //userArr;	                
                }
            });
            //sessionStorage.setItem(storageKey, JSON.stringify(jsonData));
            var timeStampObj = JSON.parse(sessionStorage.getItem(storageKey));
            if (timeStampObj) {
                timeStampObj = timeStampObj.timestamp;
            }
            else { timeStampObj = new Date(); }
            sessionStorage.setItem(storageKey, JSON.stringify({
                timestamp: timeStampObj,
                content: jsonData
            }));
        }
        function onUpdateItemFailed(jqXHR, textStatus, error) {
            console.log('Request failed \n Error Message : ' + error);
        }
    }
    catch (err) {
        console.log("Error: " + err.message);
    }
}