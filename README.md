# Backend of Motion Project

## Core Entity
- [x] id
- [x] createdAt
- [x] updatedAt

## User Entity:
- [x] email
- [x] password
- [x] role(clien|owner|delivery)

## User CRUD:
- [x] Create Account
- [x] Log In
- [x] See Profile
- [x] Edit Profile
- [x] Verify Email

## Restaurant Entity:
- [x] name
- [x] category
- [x] address
- [x] coverImage

## Restaurant CRUD:
- [x] Edit Restaurant
- [x] Delete Restaurant

- [x] See categories
- [x] See Restaurants by Caregory (pagination)
- [x] See Restaurants (pagination)
- [x] See Restaurant
- [x] Search Restaurant

## Dish CRUD:
- [x] Create Dish
- [x] Edit Dish
- [x] Delete Dish

## Orders CRUD:
- [x] Create Order
- [x] Read Order
- [x] Edit Order
- [ ] Add Driver to Order

## Orders Subscription(Owner, Customer, Delivery)
- [x] Pending Orders (for Restaurant Owner) subscription: newOrder, trigger: createOrder(newOrder)
- [x] Pending Pickup Order (for Delivery) subsciption: orderUpdate, trigger: editOrder(orderUpdate)
- [x] Order Status (Customer) subsciption: orderUpdate, trigger: editOrder(orderUpdate)

## Payment(cron)