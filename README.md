Contributor License Agreement Chooser
=====================================

This is a simple Contributor License Agreement wizard that uses
bootstrap, jquery and bootstrap-wizard.

Everything is included here in this repo to deploy this purely client-side
contributor license agreement chooser.

https://github.com/contributoragreements/ca-cla-chooser

Installation
============

 ```
 git clone https://github.com/contributoragreements/ca-cla-chooser
 cd ca-cla-chooser
 git submodule init
 git submodule update
 ```

Configuration
=============

The location of the microservices (https://github.com/contributoragreements/service.fabricatorz.com) defaults to service.fabricatorz.com url. This can be changed through js/config.json file e.g.:

  ```
  {
      "serviceUrl": "http://contributoragreements.org",
      "urlShortener": "http://contributoragreements.org/u2s"
  }
  ```

The html2pdf service location is hardcoded in index.html as "http://fab2pdf.herokuapp.com/".

Local testing
=============

In root of repo directory run for example simple python http server:
 `python -m SimpleHTTPServer` (python 2) or `python -m http.server` (python 3)

Further development
===================

Ideas for further development can be found in the issues and pull requests of this repo and in the forks of this repo:

https://github.com/contributoragreements/ca-cla-chooser/issues?q=is%3Aopen+is%3Aissue
https://github.com/step21/ca-cla-chooser/pulls

in the file "doc-todo.md",

and in the comments in the file "js/chooser.js".

Probably important ones are:

- update to bootstrap 3 or 4

Support
=======

* team@contributoragreements.org
