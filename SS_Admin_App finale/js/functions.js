/*=====================================
      Global Variables
======================================*/
var employeesList = [];
var SignedUser = null;
var adminsList = [];
var supervisorsList = [];
var waitersList = [];
var mainCategories = [];
var subCategories = [];
var menuItemId = null;
var category = null;
var categoriesMap = new Map();
var d = new Date();
d.setHours(0,0,0,0);


/*=====================================
    initialize firebase
======================================*/
const firebaseConfig = {
    apiKey: "AIzaSyB-ONpEfGsObnhbnEWoczi7KYnWw7lJQYA",
    authDomain: "smartserve-9e1e5.firebaseapp.com",
    databaseURL: "https://smartserve-9e1e5.firebaseio.com",
    projectId: "smartserve-9e1e5",
    storageBucket: "smartserve-9e1e5.appspot.com",
    messagingSenderId: "1070424995930",
    appId: "1:1070424995930:web:9437bd15d3755625e30063",
    measurementId: "G-2W5H7B4H2D"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
const Inventory = db.collection("LaPiazzaInventory");


/*=====================================
  Loading appropriate functions
======================================*/
window.onload = function(){
  db.collection("Employees").onSnapshot(function(querySnapshot) {
    employeesList = [];
      querySnapshot.forEach((doc) => {
          var empNo = doc.get("empNumber");
          var position = doc.get("position");
          var name = doc.get("name");
          var cellphone = doc.get("cellphone")
          var employee = {emplNo: empNo, position: position, name: name, cellphone: cellphone, id: doc.id};
          switch(position){
            case "Admin":
                adminsList.push(employee);
                break;
            case "Supervisor":
                supervisorsList.push(employee);
                break;
            case "Waiter":
                waitersList.push(employee);
                break;
          }
          employeesList.push(employee);
      });
    var url = window.location.href.split("/");
    page = url[url.length - 1].trim();
    var btLogout = $('#logout');
    if (btLogout != null) {
        $('#logout').on('click', function(){
            sessionStorage.removeItem("SignedUser");
            if(page == "index.html"){
                window.location.href = "pages/login.html";
            }else{
                window.location.href = "login.html";
            }
        });
    }
    if (page != "login.html") {
      SignedUser = JSON.parse(sessionStorage.getItem("SignedUser"));
      if (SignedUser == null) {
          window.location.href = "login.html";
      }else{
          var name = SignedUser.name;
          $('#signed_user').text(name);
      }
    }
    switch(page){
      case "menu.html":
          loadMenu();
        break;
      case "sales_report.html":
          loadReports();
        break;
      case "staff.html":
          loadEmployees();
        break;
      case "inventory.html":
          loadInventory();
        break;
      case "login.html":
          loadLogIn();
        break;
    }
  });
}

/*=====================================
              Login
======================================*/
function loadLogIn (){
  $('#login_btn').on('click', function(){
    login();
  });

  $("#unsername").keyup(function(event) {
    if (event.keyCode === 13) {
      $("#login_btn").click();
    }
  });

  $("#password").keyup(function(event) {
    if (event.keyCode === 13) {
      $("#login_btn").click();
    }
  });
}

function login (){
  var username = $('#unsername').val().trim();
  var password = $('#password').val().trim();
  if (username == null || username == "") {
    alert("Please insert a username");
    return;
  }
  if (password == null || password == "") {
    alert("Please insert a password");
    return;
  }
  var index = adminsList.findIndex((e) => e.name === username);
  if (index == -1) {
    alert("Username or password incorrect");
  }else{
    var currentUser = adminsList[index];
    var correctPass = currentUser.emplNo;
    if (password == correctPass) {
      sessionStorage.setItem("SignedUser", JSON.stringify(currentUser));
      window.location.href = "../index.html";
    }else{
      alert("Username or password incorrect");
    }
  }
}

/*=====================================
        Menu
======================================*/
function loadMenu (){
  //Load the Menu page
  loadMainCategories();
  $('#main_categories').on('click', '#main', function(){
    var mainCategory = $(this).find('.dropdown-btn').text().trim();
    $('#main_name').text(mainCategory);
    $(this).find('.dropdown-container').empty();
    this.classList.toggle("active");
    var dropdownContent = $(this).find('.dropdown-container')[0];
    if (dropdownContent.style.display === "block") {
      dropdownContent.style.display = "none";
    } else {
      dropdownContent.style.display = "block";
    }
    loadSubCategories(mainCategory, this);
  });

  $('#main_categories').on('click', '.dropdown-container li', function(e){
    var subCategory = $(this).text();
    loadMenuItems(subCategory);
    $('#sub_name').text(subCategory);
    e.stopPropagation();
  });

  $('#add_item_menu').on('click', function(){
    preparePopupCategories();
  });

  $('#popup_categories').on('mouseover', '.mainCats', function(){
    var mainCategory = $(this).text().trim();
    var subCategories = categoriesMap.get(mainCategory);
    var divId = $(this).closest('.menuitem').find('.menu-op')[0];
    $(divId).empty();
    for (var i = 0; i < subCategories.length; i++) {
      var category = subCategories[i];
      var html = '<div class="menuitem"><a class="subCateg">'+category+'</a></div>';
      $(divId).append(html);
    }
  });

  $('#popup_categories').on('click', '.subCateg', function(){
    var subCategory = $(this).text().trim();
    var mainCategory = $(this).closest('.menu-op').siblings('.mainCats')[0].innerHTML;
    var newCategory = mainCategory + "/ " + subCategory;
    $('#new_cat_name').text(newCategory);
  });

  $('#submitItem').on('click', function(){
    var categories = $('#new_cat_name').text();
    var subCategory = categories.split("/")[1].trim();
    var price = $('#currency-field').val();
    var name = $('#item_name').val();
    var description = $('#description').val();
    var picture = "https://firebasestorage.googleapis.com/v0/b/smartserve-9e1e5.appspot.com/o/La%20Piazza%20Logo.jpg?alt=media&token=d0468fef-941b-4bc4-a0ef-a9ede8555cb9"
    price = price.substr(1);
    if (name.length < 3) {
      alert("Please enter a valid item name");
    }else{
      if (menuItemId != null) {
        db.collection("LaPiazzaMenu").doc(menuItemId).update({name: name, price: price,
          description: description, subCate: subCategory})
        .then(function(){
          menuItemId = null;
          window.location.href = "";
         });
      }else{
        db.collection("LaPiazzaMenu").doc().set({name: name, price: price, available: true,
          description: description, subCate: subCategory, picture: picture})
        .then(function(){
          window.location.href = "";
        });
      }
    }
  });

  $('#menuItems').on('change', '#availability', function(){
    var Id = $(this).closest('.price-and-edit').find('p')[0].innerHTML;
    var selection = $(this).children("option:selected").val();
    if (selection == "Available") {
      db.collection("LaPiazzaMenu").doc(Id).update({available: true});
    }else{
      db.collection("LaPiazzaMenu").doc(Id).update({available: false});
    }
  })

  $('#menuItems').on('click', '.edit-item', function(){
    preparePopupCategories();
    menuItemId = $(this).closest('.price-and-edit').find('p')[0].innerHTML;
    console.log(menuItemId);
    var price = $(this).closest('.price-and-edit').find('.price')[0].innerHTML;
    var name = $(this).closest('.item').find('h3')[0].innerHTML;
    var description = $(this).closest('.item').find('p')[0].innerHTML;
    window.location.href="#addItemPopup";
    var mainCategory = $('#main_name').text().trim();
    var subCategory = $('#sub_name').text().trim();
    var newCategory = mainCategory + "/ " + subCategory
    $('#new_cat_name').text(newCategory);
    $('#description').val(description);
    $('#currency-field').val(price);
    $('#item_name').val(name);
  });

  $('#menuItems').on('click', '.remove-item-btn', function(){
    var id = $(this).siblings('.price-and-edit').find('p')[0].innerHTML;
    id = "LaPiazzaMenu/" + id;
    doConfirm(id);
  });

  $('#add_category').on('click', function(){
    var modal = document.getElementById("ss_addCategory");
    modal.style.display = "block";
    $('#categories_select').empty();
    $('#categories_select').append('<option selected>New Category</option>');
    for (var i = 0; i < mainCategories.length; i++) {
      var mainCategory = mainCategories[i];
      var htmlMain = '<option>'+mainCategory+'</option>';
      $('#categories_select').append(htmlMain);
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }
  });

  $('#categories_select').change(function(){
    var selectedCat = $(this).children("option:selected").val();
    $('#editable_sub_categories').children().not(':first-child').remove();
    if (selectedCat == "New Category") {
      $('#newCategory').val("");
      return;
    }
    $('#newCategory').val(selectedCat);
    var subCategories = categoriesMap.get(selectedCat);
    for (var i = 0; i < subCategories.length; i++) {
      var subCategory = subCategories[i];
      $('#editable_sub_categories').append(editableSubCategoryHtml(subCategory));
    }
  });

  $('#editable_sub_categories').on('click', '#remove_subcategory', function(){
    $(this).closest('.input-group').remove();
  });

  $('#close_category').on('click', function(){
    closeEditingCategories();
  });

  $('#add_categ_btn').on('click', function(){
    doneChangesToCategories();
  });

  $('.input-group-addon').on('click', function(){
    var newCategory = $(this).closest('.input-group').find('input').val();
    $('#editable_sub_categories').append(editableSubCategoryHtml(newCategory));
  });
}

function doneChangesToCategories(){
  var mainCategory = $('#newCategory').val().trim();
  var children = $('#editable_sub_categories').children().not(':first-child');
  var subCategories = [];
  for (var i =  0; i < children.length; i++) {
    var child = children[i];
    var value = $(child).find('input').val();
    subCategories.push(value);
  }
  var found = $.inArray(mainCategory, mainCategories);
  if (found == -1) {
    if (children.length != 0) {
      mainCategories.push(mainCategory);
      db.collection("LaPiazzaMenu").doc("categories")
      .update({categories: mainCategories, [mainCategory]: subCategories})
      .then(function(){
        categoriesMap.set(mainCategory, subCategories);
        closeEditingCategories();
      });
    }else{
      closeEditingCategories();
      return;
    }
  }else{
    if (children.length == 0) {
      db.collection("LaPiazzaMenu").doc("categories").update({
        categories: firebase.firestore.FieldValue.arrayRemove(mainCategory),
        [mainCategory]: firebase.firestore.FieldValue.delete()
      });
      closeEditingCategories();
      return;
    }
    var oSubCategories = categoriesMap.get(mainCategory);
    if (!arraysEqual(oSubCategories, subCategories)) {
      db.collection("LaPiazzaMenu").doc("categories").update({[mainCategory]: subCategories})
      .then(function(){
        categoriesMap.set(mainCategory, subCategories);
        closeEditingCategories();
      });
    }else{
      closeEditingCategories();
    }
  }
}

function arraysEqual(arr1, arr2) {
  if(arr1.length !== arr2.length)
      return false;
  for(var i = arr1.length; i--;) {
      if(arr1[i] !== arr2[i])
          return false;
  }
  return true;
}

function closeEditingCategories(){
  var modal = document.getElementById("ss_addCategory");
  $('#editable_sub_categories').children().not(':first-child').remove();
  $('#newCategory').val("");
  modal.style.display = "none";
}

function editableSubCategoryHtml(category){
  var html = '<div class="input-group">\
                  <input id="email" type="text" class="form-control" name="email" value="'+category+'">\
                  <span class="input-group-addon" id="remove_subcategory"><i class="fa fa-times"></i></span>\
              </div>';
  return html;
}

function doConfirm(id) {
  Dialog.confirm('Are you sure?', 'Deleting Item', (dlg) => {
      db.doc(id).delete().then(function(){
        dlg.close();
      });
  }, (dlg) => {
      dlg.close();
  });
}

function preparePopupCategories (){
  var mainCategory = $('#main_name').text().trim();
  var subCategory = $('#sub_name').text().trim();
  var newCategory = mainCategory + "/ " + subCategory
  $('#new_cat_name').text(newCategory);
  $('#popup_categories').empty();
  for (var i = 0; i < mainCategories.length; i++) {
    var mainCategory = mainCategories[i];
    var htmlMain = '<div class="menuitem">\
                <a class="mainCats">'+mainCategory+'</a>\
                <div class="menu-op">\
                  <div class="menuitem"><a>Sub Category</a></div>\
                </div>\
            </div>';
    $('#popup_categories').append(htmlMain);
  }
}

function loadMainCategories(){
  db.collection("LaPiazzaMenu").doc("categories").get().then((doc) =>{
    mainCategories = doc.get("categories");
    for (var i = 0; i < mainCategories.length; i++) {
      var category = mainCategories[i];
      var subCats = doc.get(category);
      categoriesMap.set(category, subCats);
      var html = '<li id="main">\
                        <button class="dropdown-btn">'+category+'</button>\
                        <ul class="dropdown-container"></ul>\
                      </li>';
            $('#main_categories').append(html);
    }
    $('#main_name').text(mainCategories[0]);
    loadSubCategories(mainCategories[0], $('#main_categories').children()[0]);
  });
}

function loadSubCategories (mainCategory, parent){
  subCategories = [];
  db.collection("LaPiazzaMenu").doc("categories").get().then((doc) =>{
    subCategories = doc.get(mainCategory);
    loadMenuItems(subCategories[0]);
    $('#sub_name').text(subCategories[0]);
    for (var i = 0; i < subCategories.length; i++) {
      var category = subCategories[i];
      var html = '<li><a>'+category+'</a></li>';
      $(parent).find('.dropdown-container').append(html);
    }
  });
}

function loadMenuItems (subCategory){
	db.collection("LaPiazzaMenu").where("subCate", "==", subCategory).onSnapshot(function(querySnapshot) {
		$('#menuItems').empty();
		querySnapshot.forEach((doc) =>{
			var name = doc.get("name");
			var description = doc.get("description");
			var price = doc.get("price");
      var isAvailable = doc.get("available");
      var available = "";
      var Unavailable = "";
      if (isAvailable) {
        available = "selected";
      }else{
        Unavailable = "selected";
      }
			var html = '<div class="item">\
                    <div class="add-ingredients">\
                      <button type="button" id="viewAddIngredients" class="add-ingred-btn">Ingredients</button>\
                    </div>\
		        			<h3>'+name+'</h3>\
        					<p>'+description+'</p>\
        					<div class="price-and-edit">\
        						<span class="price">R'+price+'</span>\
                      <select name="name" class="item-availability" id="availability">\
                          <option '+available+'>Available</option>\
                          <option '+Unavailable+'>Unavailable</option>\
                      </select>\
        						<a class="edit-item">Edit</a>\
        						<p hidden>'+doc.id+'</p>\
		        			</div>\
                  <button class="remove-item-btn"><i class="fa fa-times"></i></button>\
        				</div>'
        	$('#menuItems').append(html);
		});
	});
}

/*=====================================
        Employees
======================================*/
function loadEmployees (){
  //load Employees page
    prepareStaffTable(employeesList);
    var contents = document.querySelectorAll("[contenteditable=true]");
    [].forEach.call(contents, function (content) {
      // When you click on item, record into `data-initial-text` content of this item.
        content.addEventListener("focus", function () {
            content.setAttribute("data-initial-text", content.innerHTML);
        });
        // When you leave an item...
        content.addEventListener("blur", function () {
            // ...if content is different...
            if (content.getAttribute("data-initial-text") !== content.innerHTML) {
                var id = $(content).closest('tr').find('#doc_id').text();
            var col = $(this).parent().children().index($(this));
            var text = content.innerHTML;
            var updateDoc;
            if (id == null || id == "") {
              updateDoc = db.collection("Employees").doc();
            }else{
              updateDoc = db.collection("Employees").doc(id);
            }
            switch(col){
              case 0:
                updateDoc.update({name: text});
                break;
              case 1:
                updateDoc.update({position: text});
                break;
              case 2:
                updateDoc.update({empNumber: text});
                break;
              case 3:
                updateDoc.update({cellphone: text});
                break;
            }
            }
        });
    });

    $('.table-remove').click(function () {
        var id = $(this).closest('tr').find('#doc_id').text();
        id = "Employees/" + id;
        doConfirm(id);
    });


  $('.table-add').click(function () {
      updateDoc = db.collection("Employees").doc()
      .set({name: "Add Name", position: "Select a position", 
        empNumber: "Set a password", cellphone: "Insert Cell Number"});
  });

  $('#employees_table').on('change', '.select-position', function(){
    var id = $(this).closest('tr').find('#doc_id')[0].innerHTML;
    var position = $(this).children("option:selected").val();
    if (position != "Select Position") {
      db.collection("Employees").doc(id).update({position: position});
    }
  });
}

function prepareStaffTable (employeesList){
  var table = document.getElementById('employees_table');
    while(table.rows.length > 2) {
      table.deleteRow(1);
  }
  for (var i = 0; i < employeesList.length; i++) {
    var employee = employeesList[i];
    var name = employee.name;
    var position = employee.position;
    var pin = employee.emplNo;
    var cellphone = employee.cellphone;
    var id = employee.id;
    var Admin = "";
    var Supervisor = "";
    var Waiter = "";
    var selectPosition = "";
    switch(position){
      case "Waiter":
        Waiter = "selected";
        break;
      case "Supervisor":
        Supervisor = "selected";
        break;
      case "Admin":
        Admin = "selected";
        break;
      default:
        selectPosition = "selected";
    }
    var html = '<tr>\
                <td contenteditable="true">'+name+'</td>\
                <td contenteditable="false">\
                  <select name="position" class="select-position">\
                    <option '+selectPosition+' disabled>- Select Position -</option>\
                    <option '+Admin+'>Admin</option>\
                    <option '+Supervisor+'>Supervisor</option>\
                    <option '+Waiter+'>Waiter</option>\
                  </select></td>\
                <td contenteditable="true">'+pin+'</td>\
                <td contenteditable="true" class="w3-hide-small">'+cellphone+'</td>\
                <td id="doc_id" hidden contenteditable="true">'+id+'</td>\
                <td>\
                    <i class="table-remove fa fa-remove"></i>\
                </td>\
              </tr>';
    if (name == "Add Name" || position == "Select a position" || 
      pin == "Set a password" || cellphone == "Insert Cell Number") {
      $('#employees_table tr:first').after(html);
    }else{
      $('#employees_table tr:last').after(html);
    }
  }
}

/*=====================================
        Reports
======================================*/
function loadReports (){
  var ad = new Date();
  var n = ad.getMonth();
  var today = ad.getDate();
  dailySales(today, today+1);
  loadVoids (today, today+1);
  monthlySales(n);
  waiterSales();

  $('#month_picker').change(function(){
    var month = $(this).children("option:selected").val();
    monthlySales(month);
  });

  $('#day_picker').change(function(){
    var daysBack = $(this).children("option:selected").val();
    var showDay = +today - +daysBack;
    dailySales(showDay, (+showDay + 1));
  });

  $('#waiters_list').on('click', 'li', function(){
    var empNumber = $(this).find('a')[0].innerHTML.trim();
    var table = document.getElementById('waiter_sales_table');
    console.log("Something happened")
    while(table.rows.length > 2) {
      table.deleteRow(1);
    }
    db.collection("Orders").where("tableOpenedAt", ">", d).where("servedBy", "==", empNumber)
    .get().then((querySnapshot) =>{
      $('#n_tables_served').text(querySnapshot.size);
      var dailyTotal = 0;
      var soldItems = [];
      $('#sales_per_table').empty();
      querySnapshot.forEach((doc) =>{
        var table = doc.get("table");
        var total = doc.get("total");
        var paid = doc.get("paid");
        var tip = doc.get("tip");
        if (tip == null) {
          tip = 0;
        }
        if (paid == null) {
          paid = 0;
        }
        var tableHtml = '<table id='+doc.id+' class="table table-bordered table-striped w3-card" id="d_sales_table" style="margin-bottom: 20px">\
                          <thead>\
                            <h4 >Table '+table+'</h4>\
                            <tr>\
                              <th>Menu Item</th>\
                              <th>Menu Categ</th>\
                              <th>Item Qty</th>\
                              <th>Gross Amount (R)</th>\
                            </tr>\
                          </thead>\
                          <tbody>\
                            <!-- this is the total of all item -->\
                            <tr style="font-weight: bolder;">\
                              <td colspan="3">Total of Items</td>\
                              <td>R'+total+'</td>\
                            </tr>\
                            <!-- total amount paid by the customer -->\
                            <tr style="font-weight: bolder;">\
                              <td colspan="3">Total Paid</td>\
                              <td>R'+paid+'</td>\
                            </tr>\
                            <tr style="font-weight: bolder;">\
                              <td colspan="3">Tip</td>\
                              <td>R'+tip+'</td>\
                            </tr>\
                          </tbody>\
                        </table>';
        $('#sales_per_table').append(tableHtml);
        var items = doc.get("servedItems");
        if (items == null) {
          items = doc.get("pendingItems");
        }else{
          items = items.concat(doc.get("pendingItems"));
        }
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var name = item.name;
          var qty = item.quantity;
          var subTotal = item.subTotal;
          var category = item.subCat;
          addItemToSales(soldItems, item);
          var itemHtml = '<tr>\
                            <td>'+name+'</td>\
                            <td>'+category+'</td>\
                            <td>'+qty+'</td>\
                            <td>'+subTotal+'</td>\
                          </tr>'
          $('#'+doc.id+' tr:first').after(itemHtml);
        }
      });
      for (var i = 0; i < soldItems.length; i++) {
        var soldItem =soldItems[i];
        var name = soldItem.name;
        var qty = soldItem.quantity;
        var subTotal = soldItem.subTotal;
        var subCat = soldItem.subCat;
        dailyTotal = (+dailyTotal + +subTotal).toFixed(2);
        var saleRow = '<tr>\
                        <td>'+name+'</td>\
                        <td>'+subCat+'</td>\
                        <td>'+qty+'</td>\
                        <td>'+subTotal+'</td>\
                      </tr>'
        $('#waiter_sales_table tr:last').before(saleRow);
      }
      $('#waiter_total').text(dailyTotal);
    });
    $('#waiters_list').children('li').removeClass("active-tab");
    $('#waiterSales').fadeIn("slow").show();
    $('#day').removeClass("active-tab");
    $('#tsales').removeClass("active-tab");
    $('#voids').removeClass("active-tab");
    $(this).addClass("active-tab");
    $('#totalSales').hide();
    $('#daily').hide();
    $('#voidedItem').hide();
  });
}


function dailySales(start, end){
  var date = new Date(), y = date.getFullYear(), m = date.getMonth();
  var startDate = new Date(y, m, start);
  var endDate = new Date(y, m, end);
  $('#daily_total_date').text(startDate.toLocaleDateString('en-GB'));
  var table = document.getElementById('d_sales_table');
  while(table.rows.length > 2) {
    table.deleteRow(1);
  }
  db.collection("Orders").where("tableOpenedAt", ">", startDate).where("tableOpenedAt", "<", endDate)
  .orderBy("tableOpenedAt", "asc").onSnapshot(function(querySnapshot) {
    var dailyTotal = 0;
    var soldItems = [];
    querySnapshot.forEach((doc) => {
      var items = doc.get("servedItems");
        if (items == null) {
          items = doc.get("pendingItems");
        }else{
          items = items.concat(doc.get("pendingItems"));
        }
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        addItemToSales(soldItems, item);
      }
    });
    for (var i = 0; i < soldItems.length; i++) {
        var soldItem =soldItems[i];
        var name = soldItem.name;
        var qty = soldItem.quantity;
        var subTotal = soldItem.subTotal;
        var subCat = soldItem.subCat;
        dailyTotal = (+dailyTotal + +subTotal).toFixed(2);
        var saleRow = '<tr>\
                        <td>'+name+'</td>\
                        <td>'+subCat+'</td>\
                        <td>'+qty+'</td>\
                        <td>'+subTotal+'</td>\
                      </tr>'
        $('#d_sales_table tr:last').before(saleRow);
      }
    $('#daily_total').text(dailyTotal);
  });

  $('#save_pdf').on('click', function(){
    monthlySalePdf();
  });
}

function monthlySalePdf(){ 
  var month = $('#month_picker').children("option:selected").val(); 
  var dateOfNow = new Date(); var yearFull = dateOfNow.getFullYear(); 
  var doc = new jsPDF('p', 'pt'); 
  var Title = getMonthName(month) + " " + yearFull + " Sales"; 
  doc.text(Title, 40, 30); 
  var elem = document.getElementById("m_sales_table"); 
  var res = doc.autoTableHtmlToJson(elem); doc.autoTable(res.columns, res.data); 
  doc.save(getMonthName(month) + " Sales.pdf"); 
}

function monthlySales(month){
  document.getElementById('month_picker').value = month;
  var date = new Date(), y = date.getFullYear();
  var firstDay = new Date(y, month, 1);
  var lastDay = new Date(y, (+month + 1), 0);
  db.collection("Orders").where("tableOpenedAt", ">", firstDay).where("tableOpenedAt", "<", lastDay)
  .orderBy("tableOpenedAt", "asc").onSnapshot(function(querySnapshot) {
    var soldItems = [];
    var dailySales = [];
    var monthlyTotal = 0;
    var table = document.getElementById('m_sales_table');
    while(table.rows.length > 2) {
      table.deleteRow(1);
    }
    for (var day = firstDay.getDate(); day <= lastDay.getDate(); day++) {
      var dailyTotal = 0;
      querySnapshot.forEach((doc) => {
        var items = doc.get("servedItems");
        if (items == null) {
          items = doc.get("pendingItems");
        }else{
          items = items.concat(doc.get("pendingItems"));
        }
        var date = doc.get("tableOpenedAt").toDate();
        var purchaseDay = date.getDate();
        var purchaseMonth = date.getMonth();
        for (var i = items.length - 1; i >= 0; i--) {
          var item = items[i];
          var subTotal = item.subTotal;
          if (purchaseMonth == month && purchaseDay == day) {
            dailyTotal = (+dailyTotal + +subTotal).toFixed(2);            
          }
        }
      });
      var currentDate = new Date(y, month, day);
      var currDay = getWeekday(currentDate);
      var salesDay = {date: currentDate.toLocaleDateString('en-GB'), day: currDay, Total: dailyTotal};
      monthlyTotal = (+monthlyTotal + +dailyTotal).toFixed(2);
      dailySales.push(salesDay);
    }
    for (var i = 0; i < dailySales.length; i++) {
      var saleRow =dailySales[i];
      var rowDate = saleRow.date;
      var day = saleRow.day;
      var dayTotal = saleRow.Total;
      var salesDayRow = '<tr>\
                          <td>'+rowDate+'</td>\
                          <td>'+day+'</td>\
                          <td>'+dayTotal+'</td>\
                        </tr>';
      $('#m_sales_table tr:last').before(salesDayRow);
    }
    $('#monthly_total').text("R"+monthlyTotal);
  });
}

function waiterSales(){
  db.collection("Employees").get().then((querySnapshot) =>{
    querySnapshot.forEach((doc) =>{
      var name = doc.get("name");
      var empNumber = doc.get("empNumber");
      var waiterHtml = '<li class="waiter-names"><a class="waiter-sales" id="waiter" style="cursor: pointer;">'+name+'</a>\
                        <p hidden>'+empNumber+'</p></li>';
      $('#waiters_list').append(waiterHtml);
    });
  });
}

function loadVoids (start, end){
  var date = new Date(), y = date.getFullYear(), m = date.getMonth();
  var startDate = new Date(y, m, start);
  var endDate = new Date(y, m, end);
  var table = document.getElementById('voided_item_table');
  while(table.rows.length > 2) {
    table.deleteRow(1);
  }
  db.collection("LaPiazzaVoids").where("time", ">", startDate).where("time", "<", endDate)
  .orderBy("time", "asc").onSnapshot(function(querySnapshot) {
    querySnapshot.forEach((doc) =>{
      var name = doc.get("itemName");
      var qty = doc.get("quantity");
      var table = doc.get("TableNumber");
      var authorisedBy = doc.get("authorisedBy");
      var time = doc.get("time").toDate();
      time = time.toLocaleString();
      var voidHtml = '<tr>\
              <td>'+name+'</td>\
              <td>'+qty+'</td>\
              <td>'+time+'</td>\
              <td>'+table+'</td>\
              <td>'+authorisedBy+'</td>\
            </tr>';
      $('#voided_item_table tr:last').after(voidHtml);
    });
  });
}

function addItemToSales(arr, obj) {
  const index = arr.findIndex((e) => e.name === obj.name);
  if (index === -1) {
      arr.push(obj);
  } else {
      var item = arr[index];
      item.quantity = +item.quantity + +obj.quantity;
      item.subTotal = (+item.subTotal + +obj.subTotal).toFixed(2);
  }
}

function getWeekday(date){
  var weekday = new Array(7);
  weekday[0] = "Sunday";
  weekday[1] = "Monday";
  weekday[2] = "Tuesday";
  weekday[3] = "Wednesday";
  weekday[4] = "Thursday";
  weekday[5] = "Friday";
  weekday[6] = "Saturday";

  var n = weekday[date.getDay()];
  return n;
}

function getMonthName(n){
  const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
  return monthNames[n];
}

/*=====================================
        Inventory
======================================*/
function loadInventory (){
	getSideNav();
	getDropCategs();
	setTimeout(function(){getItems()},1500);
	

//load Inventory page

//------------------------- INVOKE --------------------------
  $('.invetory-items').on('click', '#viewItemHistory', function(){
    var modal = document.getElementById("itemHistory");
    modal.style.display = "block";

    window.onclick = function(event) {
        if(event.target == modal) {
          modal.style.display = "none";
        }
    }
  });

$('.invetory-items').on('click', '#viewRefill', function(){
    var modal = document.getElementById("refillItem");
    modal.style.display = "block";

    window.onclick = function(event) {
        if(event.target == modal) {
          modal.style.display = "none";
        }
    }
});

$('.invetory-items').on('click', '#viewEdit', function(){
    var modal = document.getElementById("editItem");
    $('#h3_add').hide();
    $('#add_units').hide();
    $('#h3_remaining').show();
    $('#h3_edit').show();
    $('#subtract_units').show();
    modal.style.display = "block";

    window.onclick = function(event) {
        if(event.target == modal) {
          modal.style.display = "none";
        }
    }
});

$('#add_inventory_item').on('click', function(){
    var modal = document.getElementById("editItem");
    $('#h3_remaining').hide();
    $('#h3_edit').hide();
    $('#subtract_units').hide();
    $('#h3_add').show();
    $('#add_units').show();
    modal.style.display = "block";

    window.onclick = function(event) {
        if(event.target == modal) {
          modal.style.display = "none";
        }
    }
});

$('#viewAddCategory').on('click', function(){
    var modal = document.getElementById("addInventoryCategory");
    modal.style.display = "block";
    window.onclick = function(event) {
        if(event.target == modal) {
          modal.style.display = "none";
        }
    }
});

$('#closeAddCategory').on('click', function(){
    var modal = document.getElementById("addInventoryCategory");
	modal.style.display = "none";
});

$('#closeEdit').on('click', function(){
    var modal = document.getElementById("editItem");
	modal.style.display = "none";
});
//------------------------ ADD ----------------------------------
//=====================[CATEGORY]================================
$('#add-category').on('click', function(e){
	e.preventDefault();
	var categName = $('#category-name').val().trim();
	console.log(categName.length);
	var addCategStatus = $('.add-category').find('h4')[0];

	if(categName != null && categName.length >= 3){
		var categArray = [];
		Inventory.doc('Categories').get().then(function(categories)
		{
			categArray = categories.get("categories");
			if(categArray == null){
				categArray = [];
				categArray.push(categName);
				Inventory.doc('Categories').set({categories: categArray})
				.then(function(){
					addCategStatus.style.color = "#008000";
					addCategStatus.innerHTML = "Category Successfully Added";
					$('#category-name').val("");
				}).catch(function(){
					addCategStatus.style.color = "#800000";
					addCategStatus.innerHTML = "Error while adding category";
				});	
			}else{
				categArray.push(categName);
				Inventory.doc('Categories').update({categories: categArray})
				.then(function(){
					addCategStatus.style.color = "#008000";
					addCategStatus.innerHTML = "Category Successfully Added";
					$('#category-name').val("");
				}).catch(function(){
					addCategStatus.style.color = "#800000";
					addCategStatus.innerHTML = "Error while adding category";
				});	
			}
  
		});

	}else{
	addCategStatus.style.color = "#800000";
	addCategStatus.innerHTML = "You need to add atleast 3 letters";
	}
});

//========================[ITEM]================================

var measure = 0;
var qty = 1;
var total = 0;
var units = "kg";
$('#item-total').text(total);	

$('#item-units').change(function(){
	units = $('#item-units').val();
	$('#item-total').empty();
	$('#item-total').text("");
	console.log(SignedUser);
	
});

$('#item-measure').on('keyup', function(){
	measure = $('#item-measure').val();
	if(isNaN(measure)){
		measure = 0;
	}
	$('#item-total').empty();
	total = measure * qty;
	if(units == "l" || units == "ml"){
		total = "";
	}else{
		total = measure * qty +" "+units;
	}
	$('#item-total').text(total);
});

$('#item-quantity').on('keyup', function(){
	qty = $('#item-quantity').val();
	if(isNaN(qty)){
		qty = 0;
	}
	if(units == "l" || units == "ml"){
		total = "";
	}else{
		total = measure * qty+" "+units;
	}
	$('#item-total').text(total);
});

$('#add-item').on('click', function(e){
	e.preventDefault();
	var error = null;
	var itemName = $('#item-name').val();
	var itemCategory = $('#item-category').val();
	var itemUnits = $('#item-units').val();
	var itemMeasure = $('#item-measure').val();
	var itemQuantity = $('#item-quantity').val();

	if(itemCategory != null){
		if(itemName != null && itemName.length > 2){
			if(itemQuantity != null && itemQuantity > 0){
				var docName = itemName+" "+itemMeasure+itemUnits;
				var arrayOfObject = [];
				var person = SignedUser.name;
				var lrDate = new Date();
				var lrChange = "";
				var lrTotal = 0;
				var lrReason = "Adding new item";
				if(itemUnits == "qty"){
					docName = itemName;
				}

				if(itemUnits == "qty" || itemUnits == "ml" || itemUnits == "l"){
					lrTotal = itemQuantity;
				}else{
					if(itemMeasure != null && itemMeasure > 0){
						lrTotal = itemMeasure * itemQuantity;
					}
				}

				lrChange = "+"+lrTotal;
				var obj = {
							person: person, 
							lrDate: lrDate, 
							lrChange: lrChange, 
							lrTotal: lrTotal, 
							lrReason: lrReason
				};
				console.log(obj);
				
				arrayOfObject.push(obj);

				Inventory.doc(docName).set({
					category: itemCategory,
					name: itemName,
					units: itemUnits,
					Refils: arrayOfObject,
					remainingItems: lrTotal

				}).then(function(){
					console.log("data added succefully");
				}).catch(function(error){
					console.error(error);
				});
			}else{
				error = "Item Quantity be a number greater than zero";
			}
		}else{
			error = "Item name should be characters greater than 2";
		}
	}else{
		error = "Item Category should be selected";
	}

	if(error != null){
		$('#item-add-status').html(error);
	}else{
		$('#item-add-status').html("");
	}
});


//---------------------------- GET ------------------------------

$('#inventory_categories').on('click', 'li', function(e){

	$('#inventory_categories').find('.active-category').removeClass('active-category');
	$(this).addClass('active-category');
	$('#main_name').text($(this).text());
	category = $(this).text();
	getItems();
});

}

//==================== CATEGORY FUNCTION ======================

//SIDENAVBAR CATEGORIES
function getSideNav(){
	
	Inventory.doc("Categories").onSnapshot(function(categories){
		var categs = categories.get("categories");
		$('#inventory_categories').empty();
		if(categs != null){

			for(var i = 0; i < categs.length; i++){
				if(i == 0){
					$('#main_name').text(categs[i]);
					category = categs[i];
					var html = `<li class="active-category">${categs[i]}</li>`;
					$('#inventory_categories').append(html);					
				}else{
					var html = `<li>${categs[i]}</li>`;
					$('#inventory_categories').append(html);
				}

			}
		}else{
			$('#inventory_categories').append("No categories");
		}
	});
}

//DROPDOWN CATEGORIES
function getDropCategs(){
	Inventory.doc("Categories").onSnapshot(function(categories){
		var categs = categories.get("categories");
		$('.add-edit-item #item-category').empty();
		if(categs != null){
			var html = `<option selected disabled>- Select Category -</option>`;
			$('.add-edit-item #item-category').append(html);
			for(var i = 0; i < categs.length; i++){
				var html = `<option>${categs[i]}</option>`;
				$('.add-edit-item #item-category').append(html);
			}
		}else{
			$('.add-edit-item #item-category').append("<option>No categories</option>");
		}
	});
}

function getItems(){
	$('.invetory-items').empty();

	Inventory.where("category", "==", category).onSnapshot(function(snapshots){	
		$('.invetory-items').empty();
		
		if(snapshots.size > 0){
			snapshots.forEach(function(item){
				var name = item.id;
				var data = item.data();

				var arr = item.get("Refils");
				var lastRefillDate = moment(arr[arr.length - 1].lrDate.toDate()).format('DD/MM/YYYY');
				var lastRefilTotal = arr[arr.length - 1].lrTotal;
				var remainingItems = data.remainingItems;
				var html = `<div class="item">
								<div class="overlay">
									<button type="button" class="remove-item w3-right"><i class="fa fa-trash-o"></i></button>
									<div class="action-btns align-middle text-center">
										<button type="button" class="history" id="viewItemHistory">i</button>
										<button type="button" id="viewRefill">Refill</button>
										<button type="button" id="viewEdit">Edit</button>
									</div>
								</div>
								<div class="item-content">
									<h4><span class="last-update-date">${lastRefillDate}</span></h4>
									<div class="name-and-remaining">
										<div class="col-12">
											<h2 class="text-center">${name}</h2>
										</div>
										<div class="col-12 text-center">
											<p class="item-remaining">${remainingItems} of ${lastRefilTotal}</p>
										</div>
									</div>
								</div>
							</div>`;
				$('.invetory-items').append(html);
			});
		}else{
			$('.invetory-items').empty();
			var html = `<div class="item">
							<div class="item-content">
								
								<div class="name-and-remaining">
									<div class="col-12">
										<h2 class="text-center">No items</h2>
									</div>
								</div>
							</div>
						</div>`;
		$('.invetory-items').append(html);
		}
	});

}