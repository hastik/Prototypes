<?php

declare(strict_types=1);

namespace App\Presenters;

use Nette\Application\UI\Presenter;
use Nette\Security\User;

abstract class BasePresenter extends Presenter
{
    public function __construct(protected User $user)
    {
        parent::__construct();
    }

    protected function startup(): void
    {
        parent::startup();
        if (!$this->user->isLoggedIn() && !$this instanceof SignPresenter) {
            $this->redirect('Sign:in');
        }
    }

    protected function beforeRender(): void
    {
        parent::beforeRender();
        $this->template->appUser = $this->user;
        $this->template->designCss = $this->getHttpRequest()->getUrl()->getBasePath() . 'design/css/app.css';
    }
}
