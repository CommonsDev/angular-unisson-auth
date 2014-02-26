(function() {
  var LoginCtrl, module,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  module = angular.module('angular-unisson-auth', ['http-auth-interceptor', 'ngCookies', 'googleOauth']);

  LoginCtrl = (function() {
    "Login a user";
    function LoginCtrl($scope, $rootScope, $http, $state, Restangular, $cookies, authService, Token) {
      var _this = this;
      this.$scope = $scope;
      this.$rootScope = $rootScope;
      this.$http = $http;
      this.$state = $state;
      this.Restangular = Restangular;
      this.$cookies = $cookies;
      this.authService = authService;
      this.Token = Token;
      this.authenticateGoogle = __bind(this.authenticateGoogle, this);
      this.submit = __bind(this.submit, this);
      this.logout = __bind(this.logout, this);
      this.forceLogin = __bind(this.forceLogin, this);
      this.$scope.isAuthenticated = false;
      this.$scope.username = "";
      this.$scope.loginrequired = false;
      this.$scope.$on('event:auth-loginRequired', function() {
        _this.$scope.loginrequired = true;
        return console.debug("Login required");
      });
      this.$scope.$on('event:auth-loginConfirmed', function() {
        console.debug("Login OK");
        _this.$scope.loginrequired = false;
        _this.$scope.username = _this.$cookies.username;
        return _this.$scope.isAuthenticated = true;
      });
      if (this.$cookies.username && this.$cookies.key) {
        console.debug("Already logged in.");
        this.$http.defaults.headers.common['Authorization'] = "ApiKey " + this.$cookies.username + ":" + this.$cookies.key;
        this.authService.loginConfirmed();
      }
      this.$scope.accessToken = this.Token.get();
      this.$scope.submit = this.submit;
      this.$scope.authenticateGoogle = this.authenticateGoogle;
      this.$scope.forceLogin = this.forceLogin;
      this.$scope.logout = this.logout;
    }

    LoginCtrl.prototype.forceLogin = function() {
      return this.$scope.loginrequired = true;
    };

    LoginCtrl.prototype.logout = function() {
      this.$scope.isAuthenticated = false;
      delete this.$http.defaults.headers.common['Authorization'];
      delete this.$cookies['username'];
      delete this.$cookies['key'];
      this.$scope.username = "";
      return this.$state.go('index');
    };

    LoginCtrl.prototype.submit = function() {
      var _this = this;
      console.debug('submitting login...');
      return this.Restangular.all('account/user').customPOST("login", {}, {}, {
        username: this.$scope.username,
        password: this.$scope.password
      }).then(function(data) {
        _this.$cookies.username = data.username;
        _this.$cookies.key = data.key;
        _this.$http.defaults.headers.common['Authorization'] = "ApiKey " + data.username + ":" + data.key;
        return _this.authService.loginConfirmed();
      }, function(data) {
        console.debug("LoginController submit error: " + data.reason);
        return _this.$scope.errorMsg = data.reason;
      });
    };

    LoginCtrl.prototype.authenticateGoogle = function() {
      var extraParams,
        _this = this;
      extraParams = {};
      if (this.$scope.askApproval) {
        extraParams = {
          approval_prompt: 'force'
        };
      }
      return this.Token.getTokenByPopup(extraParams).then(function(params) {
        return _this.Restangular.all('account/user/login').customPOST("google", {}, {}, {
          access_token: params.access_token
        }).then(function(data) {
          _this.$cookies.username = data.username;
          _this.$cookies.key = data.key;
          _this.$http.defaults.headers.common['Authorization'] = "ApiKey " + data.username + ":" + data.key;
          return _this.authService.loginConfirmed();
        }, function(data) {
          console.debug("LoginController submit error: " + data.reason);
          return _this.$scope.errorMsg = data.reason;
        });
      }, function() {
        return alert("Failed to get token from popup.");
      });
    };

    return LoginCtrl;

  })();

  LoginCtrl.$inject = ['$scope', '$rootScope', "$http", "$state", "Restangular", "$cookies", "authService", "Token"];

  module.controller("LoginCtrl", LoginCtrl);

}).call(this);
