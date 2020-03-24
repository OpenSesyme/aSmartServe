/*==============================================================================
                                Global Variables
==============================================================================*/
var employeesList = [];
var SignedUser = null;
var adminsList = [];
var supervisorsList = [];
var waitersList = [];
var mainCategories = [];
var subCategories = [];
var menuItemId = null;
var category = null;
var category_location = null;
var itemId = null;
var categoriesMap = new Map();
const massUnits = ["kg", "g", "mg"];
const liquidUnits = ["kl", "l", "ml"];
const allUnits = ["kg", "g", "mg", "kl", "l", "ml", "qty"];
var d = new Date();
d.setHours(0,0,0,0);


/*==============================================================================
                                initialize firebase
==============================================================================*/
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
const MenuRef = db.collection("LaPiazzaMenu");


/*==============================================================================
                        Loading appropriate functions
==============================================================================*/
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

/*==============================================================================
                                    Login
==============================================================================*/
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

/*==============================================================================
                                        Menu
==============================================================================*/
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
  MenuRef.doc("categories").get().then((doc) =>{
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
	MenuRef.where("subCate", "==", subCategory).onSnapshot(function(querySnapshot) {
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
        						<p hidden id="doc_id">'+doc.id+'</p>\
		        			</div>\
                  			<button class="remove-item-btn"><i class="fa fa-times"></i></button>\
        				</div>'
        	$('#menuItems').append(html);
		});
	});

	$('#menuItems').on('click', '#viewAddIngredients', function(){
        var modal = document.getElementById("addIngredients");
        modal.style.display = "block";
        const itemName = $(this).closest('.item').find('h3').text();
        const itemId = $(this).closest('.item').find('#doc_id').text(); 
        $('#ingred_popup_title').text(itemName + " Ingredients");
        var ingredients = [];
        showLoader();

        MenuRef.doc(itemId).get().then((menuitem) =>{
            $('#ingredients_list').empty();
        	ingredients = menuitem.data().ingredients;
        	if (ingredients != null) {
        		for (var i = 0; i < ingredients.length; i++) {
	        		var ingredient = ingredients[i];
	        		var Ingredient = `<li>
		                                <h4>
		                                    <span class="qty-added">${ingredient.qty}</span>
		                                    <span class="units-added">${ingredient.units}</span> of 
		                                    <span class="ingred-added">${ingredient.name}</span> added in 
		                                    <span>${itemName}</span>
		                                    <span class="w3-right remove-added-ingred">X</span>
		                                </h4>
		                                <p hidden id="ingred_id">${ingredient.id}</p>
		                            </li>`;
		            $('#ingredients_list').append(Ingredient);
	        	}
        	}
        	hideLoader();
        });

        Inventory.doc("Categories").get().then((doc) =>{
        	$('#ingred_categories').empty();
        	$('#ingred_categories').append(`<option selected disabled>- Select Category -</option>`);
        	var categories = doc.data().categories;
        	for (var i = 0; i < categories.length; i++) {
        		var category = categories[i];
        		$('#ingred_categories').append(new Option(category, category));
        	}
        })

        window.onclick = function(event) {
            if(event.target == modal) {
                modal.style.display = "none";
            }
        }

        $('#closeIngredients').on('click', function(){
            modal.style.display = "none";
        });

        $('.cancel').on('click', function(){
            modal.style.display = "none";
        });

        $('#ingred_categories').on('change', function(){
        	var category = $(this).val();
        	Inventory.where("category", "==", category).get().then((snapshots) =>{
        		$('#ingredient_select').empty();
        		$('#ingredient_select').append(`<option selected disabled>- Select Ingredient -</option>`);	
        		snapshots.forEach((ingredient) =>{
        			const name = ingredient.data().name;
        			const id = ingredient.id;
        			$('#ingredient_select').append(new Option(name, id));
        		});
        	});
        });

        $('#ingredient_select').on('change', function(){
        	var id = $(this).val();
        	const massUnits = ["kg", "g", "mg"];
        	const liquidUnits = ["kl", "l", "ml"];
        	Inventory.doc(id).get().then((doc) =>{
        		var units = doc.data().perItemUnits;
        		$('#ingred_units').empty();
        		if (massUnits.includes(units)) {
        			for (var i = massUnits.length - 1; i >= 0; i--) {
        				var unit = massUnits[i];
        				$('#ingred_units').append(new Option(unit, unit));
        			}
        		}else if (liquidUnits.includes(units)){
        			for (var i = liquidUnits.length - 1; i >= 0; i--) {
        				var unit = liquidUnits[i];
        				$('#ingred_units').append(new Option(unit, unit));
        			}
        		}else{
        			$('#ingred_units').append(new Option("qty", "qty"));
        		}
        	})
        })

        $('.add-ingred-btn').on('click', function(){
        	var ingred_id = $('#ingredient_select').val();
        	var units = $("#ingred_units option:selected").text();
        	var name = $( "#ingredient_select option:selected" ).text();
        	var qty = $( "#ingred_qty" ).val();
        	var Ingredient = `<li>
                                <h4>
                                    <span class="qty-added">${qty}</span>
                                    <span class="units-added">${units}</span> of 
                                    <span class="ingred-added">${name}</span> added in 
                                    <span>${itemName}</span>

                                    <span class="w3-right remove-added-ingred">X</span>
                                </h4>
                                <p hidden id="ingred_id">${ingred_id}</p>
                            </li>`;
            $('#ingredients_list').append(Ingredient);
            $( "#ingred_qty" ).val('');
        });

        $('#ingredients_list').on('click', '.remove-added-ingred', function(){
        	$(this).closest('li').remove();
        });

        $('.done-adding-ingred').on('click', function(){
        	var children = $('#ingredients_list').children();
        	var newIngredients = [];
        	for (var i = children.length - 1; i >= 0; i--) {
        		var child = children[i];
        		var name = $(child).find('.ingred-added').text();
        		var qty = $(child).find('.qty-added').text();
        		var units = $(child).find('.units-added').text();
        		var id = $(child).find('#ingred_id').text();
        		var ingredient = {name: name, qty: qty, units: units, id: id};
        		newIngredients.push(ingredient);
        	}
        	if (!arraysEqual(ingredients, newIngredients)) {
        		showLoader();
        		MenuRef.doc(itemId).update({ingredients: newIngredients}).then(() =>{
        			hideLoader();
        			modal.style.display = "none";
        		});
        	}
        });
    });

	function arraysEqual(arr1, arr2) {
	    if(arr1.length !== arr2.length)
	        return false;
	    for(var i = arr1.length; i--;) {
	        if(arr1[i] !== arr2[i])
	            return false;
	    }
	    return true;
	}
}

/*================================================================================
        								Employees
==================================================================================*/
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

/*==============================================================================
                                    Reports
==============================================================================*/
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

/*==========================================================================
        						Inventory
===========================================================================*/
function loadInventory (){
	getSideNav();
	getDropCategs();
	setTimeout(function(){getItems()},1500);

    //load Inventory page
    //------------------------- INVOKE --------------------------
    $('.invetory-items').on('click', '#viewItemHistory', function(){
        var modal = document.getElementById("itemHistory");
        // var current_date = new Date();
        // var formatted_date = moment(current_date).format("YYYY");
        modal.style.display = "block";
        var id = $(this).closest('.item').find('h2')[0].innerHTML;
        $("#item-name-history").text(id+" History");
        Inventory.doc(id).get().then(function(item){
            $('#view-history').empty();
            var refsArray = item.get("Refils");
            var monthOpening = item.get("monthOpenings");
            var data = item.data();

            for(var i = 0; i < refsArray.length; i++){
                var change = "";
                if(refsArray[i].lrChange.includes("-")){
                    change = "<span class='loss'>"+refsArray[i].lrChange+"</span>"
                }else if(refsArray[i].lrChange.includes("+")){
                    change = "<span class='added'>"+refsArray[i].lrChange+"</span>"
                }
                $('#view-history').append(`
                    <tr>
                        <td>${refsArray[i].person}</td>
                        <td class="date">${moment(refsArray[i].lrDate.toDate()).format("MMM DD")}</td>
                        <td>${change}</td>
                    </tr>
                `);
            }

            $('.opening_bal').html(monthOpening[monthOpening.length - 1].openingBallance+data.unitOfMeasure);
            $('.history .date').html("("+moment(monthOpening[monthOpening.length - 1].date.toDate()).format("MMM DD")+")");
            $('.available').find('span').text(item.data().remainingItems+data.unitOfMeasure);
        });
        window.onclick = function(event) {
            if(event.target == modal) {
            	modal.style.display = "none";
            }
        }
    });

    $('.invetory-items').on('click', '#viewRefill', function(){
        var modal = document.getElementById("refillItem");
        var arr = null;
        var error = null;
        var itemUnits = null;
        var monthOpenings = null;
        var remainingItems = null;
        modal.style.display = "block";
        var id = $(this).closest('.item').find('h2')[0].innerHTML;

        Inventory.doc(id).get().then(function(refil){
            var data = refil.data();
            arr = data.Refils;
            remainingItems = data.remainingItems;
        	monthOpenings = data.monthOpenings;
            remainingItems = data.remainingItems;
            itemUnits = data.unitOfMeasure;
            $('#refill_total').text(remainingItems);
            $('#refillItem').find('h4')[0].innerHTML = id;

            var remaining = "";
            var measureUnits = data.unitOfMeasure;
            if(massUnits.includes(measureUnits)){
                remaining = remainingItems+measureUnits;
                $('#refil-measures').html(`
                    <option selected disabled>- select measurements -</option>
                    <option>kg</option>
                    <option>mg</option>
                    <option>g</option>`
                );
            }else if(liquidUnits.includes(measureUnits) || measureUnits == "qty"){
                remaining = remainingItems;
                $('#refil-measures').html(`
                    <option selected disabled>- select measurements -</option>
                    <option>qty</option>`
                );
            }
            $('#refil-measures').val(measureUnits);
            $('.remaining').find('span')[0].innerHTML = remaining;

	        $('#amount-refill').on('keyup', function(){
	        	var input = $(this).val();
	        	if (remainingItems == null || remainingItems == "") {
	        		$('#refill_total').text(input);
	        	}else{
	        		var newTotal
	        		if (measureUnits == "qty") {
	        			newTotal = (+remainingItems + +input);
	        		}else{
	        			newTotal = (+remainingItems + +input).toFixed(2);
	        		}
	        		$('#refill_total').text(newTotal);
	        		$('.remaining').find('span')[0].innerHTML = newTotal;
	        	}
	        });
        }).catch(function(error){
            console.error(error);
        });

        $('.add-refill').on('click', function(e){
	        e.preventDefault();
	        var measurements = $('#refil-measures').val();
	        var input = $('#amount-refill').val();
	        var id = $(this).closest('#refillItem').find('#item_name')[0].innerHTML;
	        if(input == null || input < 1 || isNaN(input)){
	        	error = "Enter A number greater than zero";
	        	showSnackbar(error);
	        	return;
	        }
	        if(measurements == null){
	            error = "Please select the measurement unit";
	            showSnackbar(error);
	            return;
	        }

	        if (itemUnits == null) {
            	showSnackbar("Units not set... Please Try again");
            	return;
            }

            if (id == null || remainingItems == null || monthOpenings == null || arr == null) {
            	showSnackbar("Invalid data... Please try again");
            	return;
            }
	            
            var lrDate = new Date();
            var person = SignedUser.name;
            var lrChange = "+"+input+measurements;
            var lrTotal = remainingItems;
            var lrReason = "Refill";
    
            if(measurements == "qty" && itemUnits == "qty"){
                lrTotal = (+lrTotal + +input).toFixed(0);
                remainingItems = (+remainingItems + +input).toFixed(0);
            }else{
                lrTotal = (+lrTotal + +convert(input, measurements, itemUnits)).toFixed(2);
                remainingItems = (+remainingItems + +convert(input, measurements, itemUnits)).toFixed(2);
            }
    
            var obj = {
                lrChange: lrChange,
                lrDate: lrDate,
                lrReason: lrReason,
                lrTotal: lrTotal,
                person: person
            };

            arr.push(obj);
            var recentMonthOpening = monthOpenings[monthOpenings.length - 1];
            if (!isCurrentMonth(recentMonthOpening.date.toDate())) {
            	var newMonthOpening = {date: date, openingBallance: remainingItems.toFixed(2)};
            	monthOpenings.push(newMonthOpening);
            }
	        refillInventoryItem(id, remainingItems, monthOpenings, arr);
	    });

        window.onclick = function(event) {
            if(event.target == modal) {
            	modal.style.display = "none";
            }
        }
    });

    $('.invetory-items').on('click', '#viewEdit', function(){
        var id = $(this).closest('.item').find('h2')[0].innerHTML;
        itemId = id;
        var modal = document.getElementById("editItem");

        $('#editItem').find('h3')[0].innerHTML = "Edit Item";
        $('#editItem').find('.update-Item')[0].innerHTML = "Edit Item";
        $('#add_units').hide();
        $('#h3_remaining').show();
        $('#subtract_units').show();
        modal.style.display = "block";

        Inventory.doc(id).get().then(function(data){
            var item = data.data();
            var units = item.unitOfMeasure;
            setEditRemainingText(item.name, units, item.remainingItems, item.perItemMeasure, item.perItemUnits);
            $('#item_name_input').val(item.name);
            $('#item-units').val(item.perItemUnits);
            $('#item-measure').val(item.perItemMeasure);
        	createMeasureUnits(units);
            createPerItemUnits(item.perItemUnits)

            $('#item-units').val(item.perItemUnits);
            $('#item-category').val(item.category);
        }).catch(function(error){
            console.error(error);
        });

        window.onclick = function(event) {
            if(event.target == modal) {
            	modal.style.display = "none";
            }
        }

        $('#btCloseEdit').on('click', function(){
        	modal.style.display = "none";
        });
    });

    $('#add_inventory_item').on('click', function(){
        var modal = document.getElementById("editItem");
        var measurementUnit = $('#units-of-measurement').val();
        $('#editItem').find('h3')[0].innerHTML = "Add Item";
        $('#editItem').find('.update-Item')[0].innerHTML = "Add Item";
        $('#item_name_input').val('');
        $('#item-measure').val('');
        getDropCategs();
        $('#h3_remaining').hide();
        $('#h3_edit').hide();
        $('#subtract_units').hide();
        $('#h3_add').show();
        $('#add_units').show();
        modal.style.display = "block";
        createPerItemUnits(measurementUnit);
        createMeasureUnits(measurementUnit);

        window.onclick = function(event) {
            if(event.target == modal) {
            	modal.style.display = "none";
            }
        }
    });

    $('#add_inventory_item_mobile').on('click', function(){
        var modal = document.getElementById("editItem");
        $('#editItem').find('h3')[0].innerHTML = "Add Item";
        $('#editItem').find('.update-Item')[0].innerHTML = "Add Item";
        $('#item_name_input').val('');
        $('#item-measure').val('');
        getDropCategs();
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

    $('.close').on('click', function(){
        var close = $(this).closest('.modal').attr('id');
        var modal = document.getElementById(close);
        modal.style.display = "none";   
    });

    $('.cancel').on('click', function(){
        var cancel = $(this).closest('.modal').attr('id');
        var modal = document.getElementById(cancel);
        modal.style.display = "none";   
    });
    //------------------------ ADD ----------------------------------
    //=====================[CATEGORY]================================
    $('#add-category').on('click', function(e){
        e.preventDefault();
        var categName = $('#category-name').val().trim();
        console.log(categName.length);
        var addCategStatus = $('.add-category').find('h4')[0];

        if(categName == null || categName.length < 3){
        	addCategStatus.style.color = "#800000";
        	addCategStatus.innerHTML = "You need to add atleast 3 letters";
        	return;
        }
        var categArray = [];
        Inventory.doc('Categories').get().then(function(categories){
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
    });

    //========================[ITEM]================================

    var measure = 0;
    var qty = 1;
    var total = 0;
    var units = "qty";
    $('#item-total').text(total);	

    $('#units-of-measurement').change(function(){
        units = $(this).val();
        createMeasureUnits(units);
        createPerItemUnits(units);
        $('#item-total').text("");
    });

    $('#item-measure').on('keyup', function(){
        measure = $('#item-measure').val();
        if(isNaN(measure)){
            measure = 0;
        }
    });

    $('#item-quantity').on('keyup', function(){
        qty = $('#item-quantity').val();
        if(isNaN(qty)){
            qty = 0;
        }
        if(units == "qty"){
            total = qty;
        }else{
            total = +measure * +qty + " " + units;
        }
        $('#item-total').text(total);
    });

    $('.update-Item').on('click', function(e){
        e.preventDefault();
        var error = null;
        var action = $(this).text();
        var itemName = $('#item_name_input').val();
        var itemCategory = $('#item-category').val();
        var perItemUnits = $('#item-units').val();
        var lowLimitValue = $('#low_limit').val();
        var perItemMeasure = $('#item-measure').val();
        var itemQuantity = $('#item-quantity').val();
        var lowLimitUnits = $('#low_limit_units').val();
        var unitsOfMeasurement = $('#units-of-measurement').val();
        var lowerLimit = {limitValue: lowLimitValue, limitUnits: lowLimitUnits};
        var monthOpenings = [];

        if(itemCategory == null){
        	error = "Item name should be characters greater than 2";
        	$('#item-add-status').html(error);
        	return;
        }

        if(itemName == null || itemName.length < 3){
        	error = "Item Category should be selected";
        	$('#item-add-status').html(error);
        	return;
        }

    	showLoader();
	    if(action == "Add Item"){   
	        if(itemQuantity == null || itemQuantity < 1){
				error = "Item Quantity should be a number greater than zero";
				$('#item-add-status').html(error);
	        	return;
			}
			if(perItemMeasure == null || perItemMeasure < 1){
		        error = "Item measurement should be a number greater than zero";
		        $('#item-add-status').html(error);
	        	return;
		    }
            addInventoryItem(itemName, itemCategory, itemQuantity, perItemMeasure, perItemUnits,
             unitsOfMeasurement, monthOpenings, lowerLimit);
        }else if(action == "Edit Item"){
            editInventoryItem(itemId);
        }

        if(error != null){
            $('#item-add-status').html(error);
        }else{
            $('#item-add-status').html("");
        }
    });

    //---------------------------- DELETE ITEM ---------------------------------

    $('.invetory-items').on('click', '#remove-item', function(e){
        e.preventDefault();
        var id = $(this).closest('.item').find('h2')[0].innerHTML;

        var r = confirm("Are you sure you want to delete this item? if yes press okay!");
        if (r == true) {
        	Inventory.doc(id).delete().then(function(){
            	console.log("Item "+id+" has been deleted");
        	});
        } else {
        	txt = "You pressed Cancel!";
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

function setEditRemainingText(itemName, units, remainingItems, perItemMeasure, perItemUnits){
	if(liquidUnits.includes(units)){
        $('#h3_remaining').find('span')[0].innerHTML = remainingItems+" x "+perItemMeasure+ perItemUnits;
    }else if( units == "qty"){
        $('#h3_remaining').find('span')[0].innerHTML = itemName+" "+perItemMeasure+" "+perItemUnits+" x "+remainingItems;
    }else{
        $('#h3_remaining').find('span')[0].innerHTML = itemName+" "+remainingItems+" "+ units;
    }
}

function createPerItemUnits(measurementUnit){
    $('#item-units').empty();
	if(massUnits.includes(measurementUnit)){
        for (var i = massUnits.length - 1; i >= 0; i--) {
        	var unit = massUnits[i];
            $('#item-units').append(new Option(unit, unit));
        }
    }else if(liquidUnits.includes(measurementUnit)){
        for (var i = liquidUnits.length - 1; i >= 0; i--) {
        	var unit = liquidUnits[i];
            $('#item-units').append(new Option(unit, unit));
        }
    }else{
        for (var i = allUnits.length - 1; i >= 0; i--) {
        	var unit = allUnits[i];
            $('#item-units').append(new Option(unit, unit));
        }
    }
}

function createMeasureUnits(units){
	$('#measurements').empty();
	$('#low_limit_units').empty();

    if(massUnits.includes(units)){
        for (var i = massUnits.length - 1; i >= 0; i--) {
        	var unit = massUnits[i];
            $('#measurements').append(new Option(unit, unit));
            $('#low_limit_units').append(new Option(unit, unit));
        }
    }else if(liquidUnits.includes(units)){
        for (var i = liquidUnits.length - 1; i >= 0; i--) {
        	var unit = liquidUnits[i];
            $('#measurements').append(new Option(unit, unit));
            $('#low_limit_units').append(new Option(unit, unit));
        }
    }else{
        $('#measurements').append(new Option("qty", "qty"));
        $('#low_limit_units').append(new Option("qty", "qty"));
    }
}

function addInventoryItem (itemName, itemCategory, itemQuantity, perItemMeasure,
 perItemUnits, unitsOfMeasurement, monthOpenings, lowerLimit){
	var docName = itemName+" "+perItemMeasure+perItemUnits;
    var arrayOfObject = [];
    var person = SignedUser.name;
    var lrDate = new Date();
    var lrChange = "";
    var lrTotal = 0;
    var lrReason = "Adding new item";
    if(perItemUnits === "qty"){
        docName = itemName;
    }
    if(unitsOfMeasurement === "qty"){
        lrTotal = itemQuantity;
    }else{
        lrTotal = (itemQuantity * perItemMeasure).toFixed(2); 
        lrTotal = convert(lrTotal, perItemUnits, unitsOfMeasurement);
    }
	var monthOpening = {date: lrDate, openingBallance: lrTotal.toFixed(2)};
	monthOpenings.push(monthOpening);

    lrChange = "+"+lrTotal;
    var obj = {person: person, lrDate: lrDate, lrChange: lrChange, lrTotal: lrTotal.toFixed(2), lrReason: lrReason};
    arrayOfObject.push(obj);
    
    Inventory.doc(docName).set({
        category: itemCategory,
        name: itemName,
        perItemUnits: perItemUnits,
        Refils: arrayOfObject,
        remainingItems: lrTotal.toFixed(2),
        perItemMeasure: perItemMeasure,
        unitOfMeasure: unitsOfMeasurement,  
        lowerLimit: lowerLimit,
        monthOpenings: monthOpenings
    }).then(function(){
        $("#item-add-status").html(itemName + " " + perItemMeasure + perItemUnits + " added succefully");
        $('#item-total').text('');
        $('#item_name_input').val("");
        $('#item-units').val("");
        $('#item-measure').val("");
        $('#item-quantity').val("");
        $('#low_limit').val("");
        hideLoader();
        setTimeout(function(){
        	$("#item-add-status").html("");
        }, 5000);
    }).catch(function(error){
        console.error(error);
        hideLoader();
    });
}

function editInventoryItem(itemId){
	Inventory.doc(itemId).get().then(function(item){
        var subtract = $('#subtract_units').find('input').val();
        var name = $('#item_name_input').val();
        var measurements = $('#measurements').val();
        var itemCategory = $('#item-category').val();
        var arr = item.get("Refils");
        var data = item.data();
        var remainingItems = data.remainingItems;
        var lrDate = new Date();
        var person = SignedUser.name;
        var lrChange = "-"+subtract+measurements;
        var lrTotal = (data.remainingItems);
        var lrReason = "Subtract";
        var itemUnits = data.unitOfMeasure;
        if(itemUnits == "qty" && measurements == "qty"){
        	lrTotal -= subtract;
        	remainingItems -= subtract;                  
        }else{
        	lrTotal -= convert(subtract, measurements, itemUnits).toFixed(2);
            remainingItems -= convert(subtract, measurements, itemUnits).toFixed(2);
        }

        var obj ={
            person: person, 
            lrDate: lrDate, 
            lrChange: lrChange, 
            lrTotal: lrTotal.toFixed(2), 
            lrReason: lrReason                       
        };
        arr.push(obj);
        Inventory.doc(itemId).update({
            name: name,
            category: itemCategory,
            remainingItems: remainingItems.toFixed(2),
            Refils: arr
        }).then(function(){
        	hideLoader();
            console.log("Item updated successfully");
            $('#subtract_units').find('input').val('');
            setEditRemainingText(name, itemUnits, remainingItems, data.perItemMeasure, data.perItemUnits);
        }).catch(function(error){
        	hideLoader();
            console.error(error);
        });
    }).catch(function(error){
    	hideLoader();
        console.error(error);
    });
}

function refillInventoryItem(id, remainingItems, monthOpenings, arr){
	showLoader();
	Inventory.doc(id).update({
        remainingItems: remainingItems,
        monthOpenings: monthOpenings,
        Refils: arr
    }).then(function(){
        showSnackbar("Item refilled successfully");
        $('#amount-refill').val('');
        hideLoader();
    }).catch(function(error){
        showSnackbar(error.message);
        hideLoader();
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
                var measurementUnit = data.unitOfMeasure;
                var remaining = "";
                var lowerLimit = item.get("lowerLimit");
                if(measurementUnit == "kg" || measurementUnit == "mg" || measurementUnit == "g"){
                    remaining = remainingItems+measurementUnit+" of "+lastRefilTotal+measurementUnit;
                }else{
                    remaining = remainingItems+" of "+lastRefilTotal;
                }
                var html = `<div class="item">
              								<div class="overlay">
              									<button type="button" class="remove-item w3-right" id="remove-item"><i class="fa fa-trash-o"></i></button>
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
              											<p class="item-remaining">${remaining}</p>
              										</div>
              									</div>
              								</div>
              							</div>`;
        $('.invetory-items').append(html);

        $('#inventory .content .invetory-items .item').addClass('white-bg');

        if(parseInt(remaining) <= parseInt(lowerLimit.limitValue)) {
            $('#inventory .content .invetory-items .item').removeClass('white-bg');
            $('#inventory .content .invetory-items .item').addClass('red-bg');
        }
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
 
function convert(value, fromUnit, toUnit){
	const from_kl = {kl: 1, l: 1000, ml: 1000000};
	const from_l = {kl: 0.001, l: 1, ml: 1000};
	const from_ml = {kl: 0.000001, l: 0.001, ml: 1};
	const from_kg = {kg: 1, g: 1000, mg: 1000000};
	const from_g = {kg: 0.001, g: 1, mg: 1000};
	const from_mg = {kg: 0.000001, g: 0.001, mg: 1};

	const liquidUnitsObj = {kl: from_kl, l: from_l, ml: from_ml};
	const massUnitsObj = {kg: from_kg, g: from_g, mg: from_mg};

	var returnValue = null;
	if (massUnitsObj.hasOwnProperty(fromUnit) && massUnitsObj.hasOwnProperty(toUnit)) {
		massConversion();
	}else if (liquidUnitsObj.hasOwnProperty(fromUnit) && liquidUnitsObj.hasOwnProperty(toUnit)) {
		liquidConversion();
	}

	function massConversion(){
		returnValue = +value * massUnitsObj[fromUnit][toUnit];
	}

	function liquidConversion(){
		returnValue = +value * liquidUnitsObj[fromUnit][toUnit];
	}

	return returnValue;
}

function isCurrentMonth(inputDate){
  var today = new Date();
  today.setDate(0);
  inputDate.setDate(0);
  if(today.setHours(0,0,0,0) == inputDate.setHours(0,0,0,0)){ 
  	return true; 
  }else { 
  	return false; 
  }  
}

/*==============================================================================
				                    Multi Page
==============================================================================*/
function showLoader(){
	var loaderHtml = '<div id="loader"><div></div><h4 id="progress"></h4></div>';
	if ($('body').find('#loader').length == 0) {
		$('body').append(loaderHtml);
	}
	$("#loader").addClass("loader");
}

function hideLoader(){
	$("#loader").removeClass("loader");
}

function showSnackbar(text){
	var snackbarHtml = '<div id="snackbar">'+text+'</div>';
	if ($('body').find('#snackbar').length == 0) {
		$('body').append(snackbarHtml);
	}else{
		$('#snackbar').text(text);
	}

	var x = document.getElementById("snackbar");

	x.className = "show";

	setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}