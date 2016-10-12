var newsfeedWebPartName = "Newsfeed";
var storeSetsWebPartName = "StoreSets";
var webpartName;
var jsonData;
var storeSets;
var collListItems;
var unReadItems;
var defaultSetDate;
var storeSetID;
var blankStoreSetTemplateId = 'emptyStoresetTemplate';
var blankNewsfeedTemplateId = 'emptyNewsfeedTemplate';
var siteUrl;
var JSONListItemObj;
var counter = 0;
var pageLimit = 20;
var todaysDate = new Date();
function bindDataToTemplate(siteUrl, listName, queryText, webpartName, unReadItems, template, appendTo, isCached, isFullQuery) {
    try {
        this.webpartName = webpartName;
        if (unReadItems && unReadItems != '0#0')
            this.unReadItems = unReadItems;
        else {
            this.unReadItems = "0#0";
            sessionStorage.removeItem(storageKey);
            sessionStorage.removeItem(USER_INFO_SESSSION_KEY);
        }
        this.siteUrl = siteUrl;
        jsonObjTemp = JSON.parse(sessionStorage.getItem(storageKey));
        if (jsonObjTemp) {
            now = new Date();
            expiration = new Date(jsonObjTemp.timestamp);
            expiration.setMinutes(expiration.getMinutes() + 30);

            if (now.getTime() > expiration.getTime()) {
                sessionStorage.removeItem(storageKey);
            }
            else {
                JSONListItemObj = jsonObjTemp.content;
            }
        }
        if (webpartName == newsfeedWebPartName && (JSONListItemObj) && isCached) {
            bindData(null, isCached, true);
        }
        else {
            getListItemsAsStream(siteUrl, "Posts", queryText, function (data) { bindData(data, isCached, isFullQuery); }, function (data, responseText, error) { failed(error); });
        }
    }
    catch (ex) {
        console.log(ex.message);
    }
}

function bindData(data, isCached, isFullQuery) {
    var DataSet = [];
    var id;
    var borderClass;
    var title;
    var postCategory = "---";
    var postType = "";
    var fontClass;
    var isRead;
    var countryItem;
    var country;
    var storeTypeItem;
    var storeType;
    var likesCount;
    var likedBy;
    var html = '';
    var rowNum = 0;
    var maxReadItemId = parseInt(this.unReadItems.split('#')[0]);

    if (this.webpartName == newsfeedWebPartName && (JSONListItemObj) && isCached) {
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
                JSONListItemObj = jQuery.grep(JSONListItemObj, function (element, index) {
                    return (element.Category == postCategory);
                });
            }
        }
        for (var iCnt = 0; iCnt < JSONListItemObj.length; iCnt++) {
            var id = JSONListItemObj[iCnt]["ID"];
            if (this.unReadItems.indexOf((',' + id + ',')) > 0) {
                fontClass = "newsfeedUnread";
                isRead = 0;
            }
            else {
                if (id <= maxReadItemId) {
                    fontClass = "newsfeedRead";
                    isRead = 1;
                }
                else {
                    fontClass = "newsfeedUnread";
                    isRead = 0;
                    this.unReadItems += "," + id;
                }
            }

            title = JSONListItemObj[iCnt]["Title"];
            itemUrl = JSONListItemObj[iCnt]["ItemUrl"];
            borderClass = JSONListItemObj[iCnt]["BorderClass"];
            postCategory = JSONListItemObj[iCnt]["Category"];
            date = JSONListItemObj[iCnt]["PublishedDate"];
            country = JSONListItemObj[iCnt]["Country"];
            storeType = JSONListItemObj[iCnt]["StoreType"];
            truncatedBody = JSONListItemObj[iCnt]["Description"];
            numComments = JSONListItemObj[iCnt]["CommentsCount"];
            isReadMore = JSONListItemObj[iCnt]["IsReadMore"];
            likesCount = JSONListItemObj[iCnt]["LikesCount"];
            likedBy = JSONListItemObj[iCnt]["LikedBy"];
            origPubDate = JSONListItemObj[iCnt]["OrigPubDate"]

            DataSet.push({
                "ID": id
                , "Title": title
                , "Category": postCategory
                , "PublishedDate": date
                , "Description": truncatedBody
                , "CommentsCount": numComments
                , "PublishedDateNonFormatDsc": JSONListItemObj[iCnt]["PublishedDateNonFormatDsc"]
                , "PublishedDateNonFormatAsc": JSONListItemObj[iCnt]["PublishedDateNonFormatAsc"]
                , "Country": country
                , "StoreType": storeType
                , "SortCalc": JSONListItemObj[iCnt]["SortCalc"]
                , "BorderClass": borderClass
                , "PostType": JSONListItemObj[iCnt]["PostType"]
                , "FontWeight": fontClass
                , "IsRead": isRead
                , "IsReadMore": isReadMore
                , "ItemUrl": itemUrl
                , "LikesCount": likesCount
                , "LikedBy": likedBy
                , "OrigPubDate": origPubDate 
            });
            if (counter < pageLimit)
                RenderHtml(id, title, itemUrl, borderClass, fontClass, postCategory, date, JSONListItemObj[iCnt]["PublishedDateNonFormatDsc"], country, storeType, likesCount, likedBy, truncatedBody, numComments, isReadMore, counter,origPubDate);
            counter++;
        }
    }
    else {
        $.each(data, function (index, oListItem) {
            isRead = 1;
            country = "";
            storeType = "";
            if (webpartName == newsfeedWebPartName) {
                activeTab = "Communications";
                fontClass = "newsfeedRread";
                id = oListItem.ID;
                title = oListItem.Title;
                countryItem = oListItem.Country;
                storeTypeItem = oListItem.StoreType;
                likesCount = oListItem.LikesCount;
                likedBy = oListItem.LikedBy;
				
                try {                	
                    $.each(countryItem, function (index, cntry) {
                        country += cntry.Label + "; ";
                    });
                    $.each(storeTypeItem, function (index, storeTyp) {
                        storeType += storeTyp.Label + "; ";
                    });

                    if (oListItem.PostType != undefined)
                        postType = oListItem.PostType;

                    if (postType != "Task" && postType != "Feedback") {
                        postType = "Communications";
                    }

                }
                catch (e) {
                    console.log(e.message);
                }

                if (oListItem.PostCategory[0] != undefined) {
                    postCategory = oListItem.PostCategory[0].lookupValue;
                }
                if (unReadItems.indexOf((',' + id + ',')) > 0) {
                    fontClass = "newsfeedUnread";
                    isRead = 0;
                }
                else {
                    if (id <= maxReadItemId) {
                        fontClass = "newsfeedRead";
                        isRead = 1;
                    }
                    else {
                        fontClass = "newsfeedUnread";
                        isRead = 0;
                        unReadItems += "," + id;
                    }
                }

                switch (postCategory) {
                    case "Front of House":
                        postCategory = "FOH";
                        borderClass = "border-FOH";
                        break;
                    case "Back of House":
                        postCategory = "BOH";
                        borderClass = "border-BOH";
                        break;
                    case "Learning":
                        postCategory = "LRN";
                        borderClass = "border-Learning";
                        break;
                    case "HR":
                        borderClass = "border-HR";
                        break;
                    case "Learning General":
                        postCategory = "LRN General";
                        borderClass = "border-LRNG";
                        break;
                    case "MD Business Sales":
                        postCategory = "MDBS";
                        borderClass = "border-MDBS";
                        break;
                    case "Programs & Events":
                        postCategory = "P&E";
                        borderClass = "border-ProgramEvents";
                        break;
                    case "Programs &amp; Events":
                        postCategory = "P&E";
                        borderClass = "border-ProgramEvents";
                        break;
                    case "Company & Culture":
                        postCategory = "C&C";
                        borderClass = "border-CompanyCulture";
                        break;
                    case "Company &amp; Culture":
                        postCategory = "C&C";
                        borderClass = "border-CompanyCulture";
                        break;
                    case "Women in Retail":
                        postCategory = "W in R";
                        borderClass = "border-CompanyCulture";
                        break;
                }

                var publishedDate = oListItem.PublishedDate;
                var date = new Date(publishedDate).format("MMM. dd, yyyy");
                var numComments = oListItem.NumComments;
                var body = oListItem.Body;
                var truncatedArr = CutString(body, 300);
                var truncatedBody = truncatedArr[1];
                var isReadMore = truncatedArr[0];
                var sortCalc = oListItem.SortCalc;
                var itemUrl = siteUrl + "/Lists/Posts/ViewPost.aspx?ID=" + id;
                var origPubDate = oListItem.OrigPubDate;
                if(origPubDate)
					origPubDate = new Date(origPubDate).format("MMM. dd, yyyy");

                DataSet.push({
                    "ID": id
                    , "Title": title
                    , "Category": postCategory
                    , "PublishedDate": date
                    , "Description": truncatedBody
                    , "CommentsCount": numComments
                    , "PublishedDateNonFormatDsc": publishedDate
                    , "PublishedDateNonFormatAsc":  new Date(publishedDate)
                    , "Country": country.substring(0, country.length - 2)
                    , "StoreType": storeType.substring(0, storeType.length - 2)
                    , "SortCalc": sortCalc
                    , "BorderClass": borderClass
                    , "PostType": postType
                    , "FontWeight": fontClass
                    , "IsRead": isRead
                    , "IsReadMore": isReadMore
                    , "ItemUrl": itemUrl
                    , "LikesCount": likesCount
                    , "LikedBy": likedBy
                    , "OrigPubDate" : origPubDate 
                });

                if (counter < pageLimit)
                    RenderHtml(id, title, itemUrl, borderClass, fontClass, postCategory, date, publishedDate, country, storeType, likesCount, likedBy, truncatedBody, numComments, isReadMore, counter, origPubDate );
                counter++;
            }
            if (this.webpartName == "UpcomingDates") {
                var displayformurl = hostweburl + "listform.aspx?PageType=4" + "&ListId=" + encodeURIComponent(self.oList.get_id()) + "&ID=" + id + "&IsDlg=1";
                DataSet.push({
                    "Title": title
                    , "DisplayFormUrl": displayformurl
                });
            }
            if (this.webpartName == storeSetsWebPartName) {
                title = oListItem.get_item("Title");
                DataSet.push({
                    "ID": oListItem.get_item("ID")
                    , "Title": oListItem.get_item("Title")
                    , "SetDate": oListItem.get_item("Set_x0020_Date") == null ? "NA" : oListItem.get_item("Set_x0020_Date").format("MMMM dd, yyyy")
                    , "SetStatus": oListItem.get_item("SetStatus") == null ? "NA" : oListItem.get_item("SetStatus")
                    , "Total": oListItem.get_item("Total_x0020_Hours") == null ? 0 : oListItem.get_item("Total_x0020_Hours")
                    , "Imaging": oListItem.get_item("Imaging_x0020_Hours") == null ? 0 : oListItem.get_item("Imaging_x0020_Hours")
                    , "Accessories": oListItem.get_item("Accessories_x0020_Hours") == null ? 0 : oListItem.get_item("Accessories_x0020_Hours")
                    , "Experiences": oListItem.get_item("Experiences_x0020_Hours") == null ? 0 : oListItem.get_item("Experiences_x0020_Hours")
                    , "Fixture": oListItem.get_item("Fixtures_x0020_Hours") == null ? 0 : oListItem.get_item("Fixtures_x0020_Hours")
                    , "Gaming": oListItem.get_item("Gaming_x0020_Hours") == null ? 0 : oListItem.get_item("Gaming_x0020_Hours")
                    , "PCs": oListItem.get_item("PCs_x0020_Hours") == null ? 0 : oListItem.get_item("PCs_x0020_Hours")
                    , "Phones": oListItem.get_item("Phones_x0020_Hours") == null ? 0 : oListItem.get_item("Phones_x0020_Hours")
                    , "Signs": oListItem.get_item("Signs_x0020_Hours") == null ? 0 : oListItem.get_item("Signs_x0020_Hours")
                    , "Other": oListItem.get_item("Others_x0020_Hours") == null ? 0 : oListItem.get_item("Others_x0020_Hours")
                    , "Notes": oListItem.get_item("Notes1") == null ? "" : oListItem.get_item("Notes1")
                    , "Merchandising": oListItem.get_item("MerchandisingHours") == null ? 0 : oListItem.get_item("MerchandisingHours")
                    , "IsSelect": false
                });
            }
        });

        var currentPageUrl = location.href.toLowerCase();
        if (currentPageUrl.indexOf("home.aspx") > -1 || (_spPageContextInfo.serverRequestPath.indexOf('home.aspx') > -1)) {
            if (this.webpartName == newsfeedWebPartName && isFullQuery)
                sessionStorage.setItem(storageKey, JSON.stringify({
                    timestamp: new Date(),
                    content: DataSet
                }));
        }
    }

    if (this.webpartName == storeSetsWebPartName) {
        storeSets = DataSet;
        if (DataSet.length > 0) {
            DataSet = DataSet[0];
            defaultSetDate = DataSet.SetDate;
            storeSetID = DataSet.ID;
            var tempDate = new Date(defaultSetDate);
            defaultSetDate = (tempDate.getMonth() + 1) + '/' + tempDate.getDate() + '/' + tempDate.getFullYear()
        }
    }

    this.jsonData = DataSet;
    if (!isFullQuery) {
        counter = 0;
        if (this.jsonData.length == pageLimit)
            GetNewsfeeds(true, true);
        else
            isFullQuery = true;

    }

    if (this.jsonData.length == 0) {
        $('#newsfeedContainer').html('<br/><div>No matching results found.</div>');
        $('#navItemCount').empty();
        bindHeaderDataToTemplate('Communications', isFullQuery);
        return;
    }

    bindHeaderDataToTemplate('Communications', isFullQuery);
    enablePaging('Communications');
    if (unReadItems.indexOf(',0') == -1)
        USER_BlogUnReadIds = unReadItems + ',0';
    else
        USER_BlogUnReadIds = unReadItems;

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
    if (isFullQuery)
        NewsfeedReadItemUpdate("0", "");
}

function RenderObject(jsonObject) {
    if (jsonObject.length > 0) {
        $.each(jsonObject, function (index, item) {
            if (index < pageLimit)
                RenderHtml(item.ID, item.Title, item.ItemUrl, item.BorderClass, item.FontWeight, item.Category, item.PublishedDate, item.PublishedDateNonFormatDsc, item.Country, item.StoreType, item.LikesCount, item.LikedBy, item.Description, item.CommentsCount, item.IsReadMore, index);
        });
    }
    else {
        $('#newsfeedContainer').html('<br/><div>No matching results found.</div>');
        $('#navItemCount').empty();
    }
}

function RenderHtml(id, title, itemUrl, borderClass, fontClass, postCategory, date, publishedDate, country, storeType, likesCount, likedBy, truncatedBody, numComments, isReadMore, counter,origPubDate ) {
    var previousHtml;

    if (parseInt(new Date(publishedDate).format("yyyyMMdd")) >= parseInt(todaysDate.format("yyyyMMdd"))) {
        borderClass = 'border-today';
    }
    else {
        borderClass = '';
    }
    var html = "<div  id='item_" + id + "' class='newsfeedItem " + borderClass + "' onclick='toggleDesc($(this)," + id + ");'>"
        + "<div class='newsfeedTitle'>"
        + "<i class='fa fa-angle-right'></i>"
        + "<i class='fa fa-angle-down'></i>"
        + "<div class='communicationAccordianTitle'>"
        + "<h2><a newsFeedItemId='" + id + "' class='" + fontClass + "' href='" + itemUrl + "' onclick='openNewsfeed($(this),event," + id + ",false);' >" + title + "</a></h2>" + "<span>" + postCategory + "</span>"
        + "<span "
        if(origPubDate){
        	html += "style='padding-right:5px;'"
        }
        html += ">" + date + "</span>"
        if(origPubDate){
		html += "<span> (" + origPubDate + ")</span>"
		}
        html += "<span class='propHeader show-for-medium-up'>Country</span><span class='show-for-medium-up'>" + country + "</span>"
        + "<span class='propHeader show-for-medium-up'>Store Type</span><span class='show-for-medium-up'>" + storeType + "</span>"
        + "</div>"
        + "</div>"
        + "<div class='newsFeedGeneric newsFeedDesc'>"
        + "<h3>Description</h3>"
        + truncatedBody
        + "</div>"
        + "<div id='newsfeedFooterCtrl' onclick='toggleDesc($(this)," + id + ");' class='newsFeedGeneric newsfeedFooter'>";

    //+ "<div class='communicationAccordianTitle'><h2><a newsFeedItemId='" + id + "' class='" + fontClass + "' onclick='openNewsfeed($(this),event," + id + ",false);' >" + title + "</a></h2>"
    //+ "<div class='ajaxLoaderDiv'></div><img class='ajaxLoaderImg' src='/teams/AVAStorePortalTest/Style%20Library/StorePortal/Images/ajax-loader.gif'/>"

    if (isReadMore)
        html += "<span><a href='" + itemUrl + "' onclick='openNewsfeed($(this),event," + id + ",true);'>Read More</a></span>";
    html += "<span><a href='" + itemUrl + "' onclick='openNewsfeed($(this),event," + id + ",true);'>Ask a question</a></span>";
    /*html += "<span id='PostCommentCount' >";
    html += "	<span title='' class='ms-comm-likesMetadata ms-metadata'>";
    html += "		<span class='ms-comm-likesImgContainer'>";
    html += "			<img src='/_layouts/15/images/LikeFull.11x11x32.png?rev=43#ThemeKey='>";
    html += "		</span>";
    html += "		<span id='numComments_" + id + "' class='ms-comm-likesCount ms-comm-reputationNumbers'>" + numComments + "</span>";
    html += "	</span>";
    html += "	<a href='" + itemUrl + "' onclick='openNewsfeed($(this),event," + id + ",true);'>Comments</a></span>";
    html += "</span>";*/

    try {
        if (likesCount == null || likesCount == undefined) {
            html += getLikesAndCommentsDOM(id, 0, 'Like'); //"<span><a href='#' id='likesElmnt-" + id + "' onclick='UpdateDiscussionLikedBy(this);'>Like</a></span>";
        }
        else {
            var likesCount = 0;
            var $v_0 = likedBy;
            if (!SP.ScriptHelpers.isNullOrUndefined($v_0)) {
                var users = new Array();
                var userAlias = '';
                var likedByCurrentUser = false;
                likesCount = $v_0.length;
                for (var $v_1 = 0, $v_2 = likesCount; $v_1 < $v_2; $v_1++) {
                    var $v_3 = $v_0[$v_1];
                    //userAlias = $v_3.$5_2;
                    userAlias = $v_3.$5_2 ? $v_3.$5_2 : $v_3.email;
                    var userId = $v_3.$1Y_1 ? $v_3.$1Y_1 : $v_3.id;
                    //if ($v_3.$1W_1 == _spPageContextInfo.userId) {
                    if (userId == _spPageContextInfo.userId || userAlias == _spPageContextInfo.userLoginName) {
                        likedByCurrentUser = true;
                    }
                }
                if (likedByCurrentUser) {
                    html += getLikesAndCommentsDOM(id, likesCount, 'Unlike'); // "<span><a href='#' id='likesElmnt-" + id + "' onclick='UpdateDiscussionLikedBy(this);'>Unlike</a></span>";
                }
                else {
                    html += getLikesAndCommentsDOM(id, likesCount, 'Like'); // "<span><a href='#' id='likesElmnt-" + id + "' onclick='UpdateDiscussionLikedBy(this);'>Like</a></span>";    	            	
                }
            }
            else {
                html += getLikesAndCommentsDOM(id, likesCount, 'Like'); // "<span><a href='#' id='likesElmnt-" + id + "' onclick='UpdateDiscussionLikedBy(this);'>Like</a></span>";
            }
        }
    }
    catch (err) {
        console.log(err.message);
    }
    //html += "<span><a href='#' id='commentElmnt-" + id + "' onclick='postUserComments(this, " + id + ");'>Comment</a></span>"
    html += "<span id='PostCommentCount' >";
    html += "	<span title='' class='ms-comm-likesMetadata ms-metadata'>";
    html += "		<span class='ms-comm-likesImgContainer'>";
    html += "			<img src='/_layouts/15/images/LikeFull.11x11x32.png?rev=43#ThemeKey='>";
    html += "		</span>";
    html += "		<span id='numComments_" + id + "' class='ms-comm-likesCount ms-comm-reputationNumbers'>" + numComments + "</span>";
    html += "	</span>";
    html += "<span><a href='#' id='commentElmnt-" + id + "' onclick='postUserComments(this, " + id + ");'>Comment</a></span>";
    html += "</span>";
    html += "</div>"
        + "</div>";

    if (counter == 0) {
        previousHtml = '';
        $('#newsfeedContainer').html(previousHtml);
    }
    else {
        previousHtml = $('#newsfeedContainer').html();
    }

    $('#newsfeedContainer').html(previousHtml + html);
}

function getLikesAndCommentsDOM(itemId, likesCount, likeUnlikeText) {
    var likeElmntHtml = "<span class='ms-comm-cmdSpaceListItem'>"
        + "				<span id='root-likesElement-" + itemId + "'>"
        + "					<span title='' class='ms-comm-likesMetadata ms-metadata'>"
        + "						<span class='ms-comm-likesImgContainer'>"
        //+ "							<img src='/_layouts/15/images/LikeFull.11x11x32.png?rev=43#ThemeKey='>"
        + "							<img src='/teams/AVAStorePortalTest/Style%20Library/StorePortal/Images/like.png?d=wfaac47e66879445baadd85814fa18527'>"
        + "						</span>"
        + "						<span class='ms-comm-likesCount ms-comm-reputationNumbers'>" + likesCount + "</span>"
        + "					</span>"
        + "					<a href='javascript:;' id='likesElement-" + itemId + "' class='ms-secondaryCommandLink' onclick='UpdateDiscussionLikedBy(this);'>" + likeUnlikeText + "</a>"
        + "				</span>"
        + "			</span>";

    return likeElmntHtml;
}

function filter(json, filterBy, postCategory) {
    var filteredJson = json.filter(function (row) {
        if (postCategory != '' && postCategory != undefined) {
            if (row.PostType == filterBy && row.Category == postCategory)
                return true;
            else
                return false;
        }
        else {
            if (row.PostType == filterBy)
                return true;
            else
                return false;
        }
    });
    return filteredJson;
}

function failed(error) {
    console.log(error);
}