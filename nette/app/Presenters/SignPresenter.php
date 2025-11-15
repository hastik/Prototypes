<?php

declare(strict_types=1);

namespace App\Presenters;

use Nette\Application\UI\Form;

final class SignPresenter extends BasePresenter
{
    public function actionOut(): void
    {
        $this->getUser()->logout(true);
        $this->flashMessage('You have been signed out.');
        $this->redirect('in');
    }

    protected function createComponentSignInForm(): Form
    {
        $form = new Form();
        $form->addText('username', 'Username')
            ->setRequired();
        $form->addPassword('password', 'Password')
            ->setRequired();
        $form->addSubmit('send', 'Sign in');

        $form->onSuccess[] = function (Form $form, \stdClass $values): void {
            try {
                $this->getUser()->login($values->username, $values->password);
                $this->redirect('Dashboard:default');
            } catch (\Throwable $e) {
                $form->addError('Login failed: ' . $e->getMessage());
            }
        };

        return $form;
    }
}
